import { jest } from '@jest/globals'
import crypto from 'crypto'

const mockSendEmail = jest.fn()

jest.unstable_mockModule('../../../app/clients/notify-client.js', () => ({
  default: {
    sendEmail: mockSendEmail
  }
}))

jest.unstable_mockModule('../../../app/repos/notification-log.js', () => ({
  logCreatedNotification: jest.fn(),
  logRejectedNotification: jest.fn()
}))

const {
  logCreatedNotification,
  logRejectedNotification
} = await import('../../../app/repos/notification-log.js')

const { sendNotification } = await import('../../../app/messages/inbound/send-notification.js')

console.log = jest.fn()

describe('Send Notification', () => {
  beforeEach(() => {
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
    const consoleSpy = jest.spyOn(console, 'error')

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

    mockSendEmail.mockRejectedValue('Email failed to send.')

    await sendNotification(message)

    expect(consoleSpy).toHaveBeenCalledWith('Error sending email: ', 'Email failed to send.')

    consoleSpy.mockRestore()
    uuidSpy.mockRestore()
  })

  test('should call logCreatedNotification when sendEmail is successful', async () => {
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

    mockSendEmail.mockResolvedValue({
      data: {
        id: 'mock-notify-response-id'
      }
    })

    await sendNotification(message)

    expect(logCreatedNotification).toHaveBeenCalledTimes(1)
    expect(logCreatedNotification).toHaveBeenCalledWith(message, 'mock-notify-response-id')
  })

  test('should call logRejectedNotification when sendEmail fails', async () => {
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

    mockSendEmail.mockRejectedValue('mock-error')

    await sendNotification(message)

    expect(logRejectedNotification).toHaveBeenCalledTimes(1)
    expect(logRejectedNotification).toHaveBeenCalledWith(message, 'mock-error')
  })
})
