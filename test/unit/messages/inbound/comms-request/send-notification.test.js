import { beforeEach, jest, test, expect } from '@jest/globals'
import crypto from 'crypto'

const mockSendEmail = jest.fn()

jest.unstable_mockModule('../../../../../app/clients/notify-client.js', () => ({
  default: {
    sendEmail: mockSendEmail
  }
}))

jest.unstable_mockModule('../../../../../app/repos/notification-log.js', () => ({
  logCreatedNotification: jest.fn(),
  logRejectedNotification: jest.fn()
}))

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-status/publish.js', () => ({
  publishStatus: jest.fn()
}))

let logCreatedNotification, logRejectedNotification, publishStatus, sendNotification

describe('Send Notification', () => {
  let mockNotifyReceiver
  let consoleErrorSpy

  beforeEach(async () => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockNotifyReceiver = {
      abandonMessage: jest.fn(),
      completeMessage: jest.fn(),
      deadLetterMessage: jest.fn()
    }

    const notificationLog = await import('../../../../../app/repos/notification-log.js')
    logCreatedNotification = notificationLog.logCreatedNotification
    logRejectedNotification = notificationLog.logRejectedNotification

    const notificationStatus = await import('../../../../../app/messages/outbound/notification-status/publish.js')
    publishStatus = notificationStatus.publishStatus

    const notificationSender = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')
    sendNotification = notificationSender.sendNotification
  })

  test('should send an email with the correct arguments to a single email address', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

    const message = {
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
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
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: ['mock-email1@test.com', 'mock-email2@test.com'],
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
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
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    }

    const mockError = {
      response: {
        data: {
          status_code: 400,
          errors: [
            {
              error: 'mock-error'
            }
          ]
        }
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await sendNotification(message)

    expect(consoleSpy).toHaveBeenCalledWith('Error sending email:', 400, undefined)

    consoleSpy.mockRestore()
    uuidSpy.mockRestore()
  })

  test('should call logCreatedNotification when sendEmail is successful', async () => {
    const message = {
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    }

    mockSendEmail.mockResolvedValue({
      data: {
        id: 'mock-notify-response-id'
      }
    })

    await sendNotification(message)

    expect(logCreatedNotification).toHaveBeenCalledTimes(1)
    expect(logCreatedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', 'mock-notify-response-id')
  })

  test('should call publishStatus when an email is sent', async () => {
    const message = {
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    }

    mockSendEmail.mockResolvedValue({
      data: {
        id: 'mock-id'
      }
    })

    await sendNotification(message)

    expect(publishStatus).toHaveBeenCalledTimes(1)
    expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', 'sending')
  })

  test('should call logRejectedNotification when sendEmail fails', async () => {
    const message = {
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    }

    const mockError = {
      response: {
        data: {
          status_code: 400,
          errors: [
            {
              error: 'mock-error'
            }
          ]
        }
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await sendNotification(message)

    expect(logRejectedNotification).toHaveBeenCalledTimes(1)
    expect(logRejectedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', mockError)
  })

  test('should call publishStatus with an error when email fails to send', async () => {
    const message = {
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: 'mock-uuid'
      }
    }

    const mockError = {
      response: {
        data: {
          error: {
            status_code: 400,
            errors: [
              {
                error: 'mock-error'
              }
            ]
          }
        }
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await sendNotification(message)

    expect(publishStatus).toHaveBeenCalledTimes(1)
    expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', 'internal-failure', mockError.response.data)
  })

  test('should log an internal failure and abandon message when notify returns a 500 status code', async () => {
    const message = {
      id: 'message-id',
      data: {
        notifyTemplateId: 'mock-notify-template-id',
        commsAddresses: 'mock-email@test.com',
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        }
      }
    }

    const mockError = {
      response: {
        status: 500,
        data: {
          errors: [
            {
              error: 'mock-error'
            }
          ]
        }
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await expect(sendNotification(message, mockNotifyReceiver)).rejects.toThrow('Technical failure - message abandoned for retry')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Internal failure sending notification:', mockError)
    expect(mockNotifyReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })
})
