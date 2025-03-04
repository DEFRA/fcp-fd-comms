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
  logRejectedNotification: jest.fn(),
  checkDuplicateNotification: jest.fn().mockResolvedValue(false)
}))

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-status/publish.js', () => ({
  publishStatus: jest.fn()
}))

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-retry/publish.js', () => ({
  publishRetryRequest: jest.fn()
}))

const {
  logCreatedNotification,
  logRejectedNotification,
  checkDuplicateNotification
} = await import('../../../../../app/repos/notification-log.js')

const { publishStatus } = await import('../../../../../app/messages/outbound/notification-status/publish.js')

describe('Send Notification', () => {
  const originalEnv = process.env

  const consoleWarnSpy = jest.spyOn(console, 'warn')
  const consoleErrorSpy = jest.spyOn(console, 'error')

  let sendNotification

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      NOTIFY_API_MAX_DELAY: 100
    }

    const handler = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')

    sendNotification = handler.sendNotification
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockSendEmail.mockResolvedValue({
      data: {
        id: '6ac51d8a-3488-4a17-ba35-b42381646317'
      }
    })
  })

  test('should skip sending when duplicate notification is detected', async () => {
    const message = {
      ...commsMessage,
      data: {
        ...commsMessage.data,
        commsAddresses: 'test@example.com'
      }
    }

    checkDuplicateNotification.mockResolvedValueOnce(true)

    await sendNotification(message)

    expect(checkDuplicateNotification).toHaveBeenCalledWith('79389915-7275-457a-b8ca-8bf206b2e67b', 'test@example.com')
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith('Duplicate notification detected')
  })

  test('should send an email with the correct arguments to a single email address', async () => {
    const message = {
      ...commsMessage,
      data: {
        ...commsMessage.data,
        notifyTemplateId: 'd29257ce-974f-4214-8bbe-69ce5f2bb7f3',
        commsAddresses: 'mock-email@test.com',
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
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        },
        reference: '79389915-7275-457a-b8ca-8bf206b2e67b'
      }
    )
  })

  test('should log an error message when sendEmail fails', async () => {
    const message = commsMessage

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

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email via GOV Notify. Error code:', 400)
  })

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

  test('should call publishStatus when an email is sent', async () => {
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

    expect(publishStatus).toHaveBeenCalledTimes(1)
    expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', 'sending')
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

  test('should retry a maximum of 10 times on a 5xx error', async () => {
    const message = commsMessage

    const mockError = {
      response: {
        status: 500
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await sendNotification(message)

    expect(mockSendEmail).toHaveBeenCalledTimes(10)
  })

  test('400 errors should not be retried', async () => {
    const message = commsMessage

    const mockError = {
      response: {
        status: 400
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await sendNotification(message)

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('should not retry greater than 5xx errors', async () => {
    const message = commsMessage

    const mockError = {
      response: {
        status: 600
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await sendNotification(message)

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  afterAll(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
