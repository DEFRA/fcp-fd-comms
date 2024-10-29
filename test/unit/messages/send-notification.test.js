import { jest } from '@jest/globals'
import { sendNotification } from '../../../app/messages/send-notification.js'

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid')
}))

const mockSendEmail = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail
  }))
}))

describe('Send Notification', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('sends an email to a single address', async () => {
    const message = {
      body: {
        data: {
          commsAddress: 'mock-email@test.com',
          notifyTemplateId: 'mock-notify-template-id',
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          }
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
  })

  test('sends emails to multiple addresses', async () => {
    const message = {
      body: {
        data: {
          commsAddress: ['mock-email1@test.com', 'mock-email2@test.com'],
          notifyTemplateId: 'mock-notify-template-id',
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          }
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
  })
})
