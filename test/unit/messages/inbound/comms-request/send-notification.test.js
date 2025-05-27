import { afterAll, beforeEach, describe, jest, test } from '@jest/globals'

import commsMessage from '../../../../mocks/comms-message.js'

jest.setTimeout(100000)

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

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-retry/publish.js', () => ({
  publishRetryRequest: jest.fn()
}))

const {
  logCreatedNotification,
  logRejectedNotification
} = await import('../../../../../app/repos/notification-log.js')

const { publishStatus } = await import('../../../../../app/messages/outbound/notification-status/publish.js')
const { publishRetryRequest } = await import('../../../../../app/messages/outbound/notification-retry/publish.js')

describe('Send notification', () => {
  const originalEnv = process.env

  const consoleLogSpy = jest.spyOn(console, 'log')
  const consoleWarnSpy = jest.spyOn(console, 'warn')
  const consoleErrorSpy = jest.spyOn(console, 'error')

  let sendNotification

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      NOTIFY_API_MAX_DELAY: 100,
      MESSAGE_RETRY_DELAY: 1000
    }

    const handler = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')

    sendNotification = handler.sendNotification
  })

  beforeEach(() => {
    jest.resetAllMocks()

    mockSendEmail.mockResolvedValue({
      data: {
        id: '6ac51d8a-3488-4a17-ba35-b42381646317'
      }
    })
  })

  describe('Status publishing', () => {
    test('should call publishStatus when a successful notification is sent', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email1@test.com',
            'mock-email2@test.com'
          ]
        }
      }

      await sendNotification(message)

      expect(publishStatus).toHaveBeenCalledTimes(2)
      expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email1@test.com', 'sending')
      expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email2@test.com', 'sending')
    })

    test('should call publishStatus with an error when email fails to send', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email@test.com'
          ]
        }
      }
      const mockError = {
        response: {
          status: 400,
          data: {
            errors: [{ message: 'mock-error-message' }]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(publishStatus).toHaveBeenCalledTimes(1)
      expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', 'internal-failure', mockError.response.data)
    })

    test('should log a error if successful notification status fails to publish', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email2@test.com'
          ]
        }
      }

      const mockError = new Error('mock-error')

      publishStatus.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error publishing notification status to data layer: mock-error')
    })
  })

  describe('Sending notifications', () => {
    const defaultEmailReplyToId = 'f824cbfa-f75c-40bb-8407-8edb0cc469d3'

    test('should send an email with the correct arguments to a single email address', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          notifyTemplateId: 'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
          commsAddresses: 'mock-email@test.com',
          emailReplyToId: defaultEmailReplyToId,
          personalisation: {
            reference: 'test-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          }
        }
      }

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenCalled()
      expect(mockSendEmail).toHaveBeenCalledWith(
        'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        'mock-email@test.com',
        {
          emailReplyToId: defaultEmailReplyToId,
          personalisation: {
            reference: 'test-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          },
          reference: '79389915-7275-457a-b8ca-8bf206b2e67b'
        }
      )
    })

    test('should send emails with the correct arguments to multiple email addresses', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email1@test.com',
            'mock-email2@test.com'
          ],
          emailReplyToId: defaultEmailReplyToId,
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          }
        }
      }

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenCalledTimes(2)

      expect(mockSendEmail).toHaveBeenNthCalledWith(1,
        'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        'mock-email1@test.com',
        {
          emailReplyToId: defaultEmailReplyToId,
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          },
          reference: '79389915-7275-457a-b8ca-8bf206b2e67b'
        }
      )

      expect(mockSendEmail).toHaveBeenNthCalledWith(2,
        'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        'mock-email2@test.com',
        {
          emailReplyToId: defaultEmailReplyToId,
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
          },
          reference: '79389915-7275-457a-b8ca-8bf206b2e67b'
        }
      )
    })

    test('should retry a maximum of 10 times on a 5xx error', async () => {
      const message = commsMessage

      const mockError = {
        response: {
          status: 500,
          data: {
            errors: [{ message: 'server-error' }]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenCalledTimes(10)
    })

    test('should send email with a different emailReplyToId correctly', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          notifyTemplateId: 'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
          commsAddresses: 'mock-email@test.com',
          emailReplyToId: '12255162-A020-44C7-8313-9745EFB4046A',
          personalisation: {
            reference: 'ref1',
            agreementSummaryLink: 'https://test.com/link1'
          }
        }
      }

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenCalledWith(
        'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        'mock-email@test.com',
        {
          emailReplyToId: '12255162-A020-44C7-8313-9745EFB4046A',
          personalisation: {
            reference: 'ref1',
            agreementSummaryLink: 'https://test.com/link1'
          },
          reference: '79389915-7275-457a-b8ca-8bf206b2e67b'
        }
      )
    })

    test('should send different replyToId for multiple email addresses', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          notifyTemplateId: 'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
          commsAddresses: [
            'email1@test.com',
            'email2@test.com'
          ],
          emailReplyToId: '1DD6B46A-7C1F-4893-BFE2-56D8FB555CC4',
          personalisation: {
            reference: 'multi-ref',
            agreementSummaryLink: 'https://test.com/multi'
          }
        }
      }

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenNthCalledWith(1,
        'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        'email1@test.com',
        expect.objectContaining({
          emailReplyToId: '1DD6B46A-7C1F-4893-BFE2-56D8FB555CC4'
        })
      )

      expect(mockSendEmail).toHaveBeenNthCalledWith(2,
        'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        'email2@test.com',
        expect.objectContaining({
          emailReplyToId: '1DD6B46A-7C1F-4893-BFE2-56D8FB555CC4'
        })
      )
    })
  })

  describe('Notification persistence', () => {
    test('should call logCreatedNotification when sendEmail is successful', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email@test.com'
          ]
        }
      }

      await sendNotification(message)

      expect(logCreatedNotification).toHaveBeenCalledTimes(1)
      expect(logCreatedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', '6ac51d8a-3488-4a17-ba35-b42381646317')
    })

    test('should call logRejectedNotification when sendEmail fails', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email@test.com'
          ]
        }
      }

      const mockError = {
        response: {
          status: 400,
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
      expect(logRejectedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', mockError.response.data)
    })

    test('should log a error if notification log call fails', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email2@test.com'
          ]
        }
      }

      const mockError = new Error('mock-error')

      logCreatedNotification.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error logging successful notification: mock-error')
    })

    test('should log a error if rejected notification status fails to publish', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email2@test.com'
          ]
        }
      }

      const mockNotifyError = {
        response: {
          status: 400,
          data: {
            status_code: 400,
            errors: [
              {
                message: 'mock-error'
              }
            ]
          }
        }
      }

      const mockError = new Error('mock-error')

      mockSendEmail.mockRejectedValue(mockNotifyError)
      publishStatus.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error publishing notification status to data layer: mock-error')
    })

    test('should log a error if rejected notification log call fails', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email2@test.com'
          ]
        }
      }

      const mockNotifyError = {
        response: {
          status: 400,
          data: {
            status_code: 400,
            errors: [
              {
                message: 'mock-error'
              }
            ]
          }
        }
      }

      const mockError = new Error('mock-error')

      mockSendEmail.mockRejectedValue(mockNotifyError)
      logRejectedNotification.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error logging rejected notification: mock-error')
    })

    test('message should be scheduled for retry when a 5xx error is encountered', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          id: '79389915-7275-457a-b8ca-8bf206b2e67b',
          commsAddresses: [
            'mock-email@test.com'
          ]
        }
      }

      const mockNotifyError = {
        response: {
          status: 500,
          data: {
            status_code: 500,
            errors: [
              {
                error: 'mock-error'
              }
            ]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockNotifyError)

      await sendNotification(message)

      expect(publishRetryRequest).toHaveBeenCalledTimes(1)
      expect(publishRetryRequest).toHaveBeenCalledWith(message, 'mock-email@test.com', 1000)
      expect(consoleLogSpy).toHaveBeenCalledWith(`Scheduling notification retry for message: ${message.id}`)
    })
  })

  describe('Technical failure retry handling', () => {
    test('should log an error message if publishRetryRequest fails', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: [
            'mock-email1@test.com'
          ],
          id: '79389915-7275-457a-b8ca-8bf206b2e67b'
        }
      }

      const mockNotifyError = {
        response: {
          status: 500,
          data: {
            status_code: 500,
            errors: [
              {
                message: 'mock-error'
              }
            ]
          }
        }
      }

      const mockError = new Error('mock-error')

      mockSendEmail.mockRejectedValue(mockNotifyError)
      publishRetryRequest.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error scheduling notification retry: mock-error')
    })

    test('should log an error message when sendEmail fails', async () => {
      const message = commsMessage

      const mockError = {
        response: {
          status: 400,
          data: {
            errors: [{
              error: 'ValidationError',
              message: 'id is not a valid UUID'
            }]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send notification via GOV Notify. Error code: 400. Message: id is not a valid UUID\n')
    })

    test('400 errors should not be retried', async () => {
      const message = commsMessage

      const mockError = {
        response: {
          status: 400,
          data: {
            errors: [{ message: 'client-error' }]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })

    test('should not retry non 5xx errors', async () => {
      const message = commsMessage
      const mockError = {
        response: {
          status: 600,
          data: {
            errors: [{ error: 'ValidationError', message: 'id is not a valid UUID' }]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })

    test('should format multiple errors correctly', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: ['test@example.com']
        }
      }

      const mockError = {
        response: {
          status: 400,
          data: {
            errors: [
              { error: 'ValidationError', message: 'id is not a valid UUID' },
              { error: 'AuthError', message: 'Error: Your system clock must be accurate to within 30 seconds' },
              { error: 'AuthError', message: 'Invalid token: API key not found' }
            ]
          }
        }
      }

      mockSendEmail.mockRejectedValue(mockError)

      await sendNotification(message)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send notification via GOV Notify. Error code: 400. Message: ' +
        'id is not a valid UUID\n' +
        'Error: Your system clock must be accurate to within 30 seconds\n' +
        'Invalid token: API key not found\n'
      )
    })

    test('should log non-govNotify errors', async () => {
      const message = {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          commsAddresses: ['test@example.com']
        }
      }

      const mockError = new Error('Network error')
      mockError.response = null

      mockSendEmail.mockRejectedValue(mockError)

      await expect(sendNotification(message)).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending notification via GOV Notify: Network error'
      )
    })
  })

  afterAll(() => {
    process.env = originalEnv

    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
