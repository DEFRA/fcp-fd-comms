import { jest } from '@jest/globals'
import crypto from 'crypto'

const mockSendEmail = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail
  }))
}))

const { sendNotification } = await import('../../../app/messages/send-notification.js')
console.log = jest.fn()

describe('Send Notification', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send an email with the correct arguments to a single email address', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

    const message = {
      body: {
        data: {
          notifyTemplateId: 'mock-notify-template-id',
          commsAddress: 'mock-email@test.com',
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          },
          reference: 'mock-uuid'
        }
      }
    }

    await sendNotification(message)

    expect(mockSendEmail).toHaveBeenCalled()
    expect(mockSendEmail).toHaveBeenCalledWith(
      'mock-notify-template-id',
      'mock-email@test.com',
      {
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    )

    uuidSpy.mockRestore()
  })

  test('should send emails with the correct arguments to multiple email addresses', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

    const message = {
      body: {
        data: {
          notifyTemplateId: 'mock-notify-template-id',
          commsAddress: ['mock-email1@test.com', 'mock-email2@test.com'],
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          },
          reference: 'mock-uuid'
        }
      }
    }

    await sendNotification(message)

    expect(mockSendEmail).toHaveBeenCalledTimes(2)

    expect(mockSendEmail).toHaveBeenNthCalledWith(1,
      'mock-notify-template-id',
      'mock-email1@test.com',
      {
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    )

    expect(mockSendEmail).toHaveBeenNthCalledWith(2,
      'mock-notify-template-id',
      'mock-email2@test.com',
      {
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    )

    uuidSpy.mockRestore()
  })

  test('should log an error message when sendEmail fails', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

    const message = {
      body: {
        data: {
          notifyTemplateId: 'mock-notify-template-id',
          commsAddress: 'mock-email@test.com',
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          },
          reference: 'mock-uuid'
        }
      }
    }

    mockSendEmail.mockRejectedValue(console.log('Email failed to send.'))
    await sendNotification(message)
    expect(console.log).toHaveBeenCalledWith('Error sending email: ', console.log('Email failed to send.'))
    uuidSpy.mockRestore()
  })
})
