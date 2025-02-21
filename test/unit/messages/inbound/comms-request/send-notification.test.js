import { beforeEach, jest, test, expect } from '@jest/globals'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'

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

const setupMocks = async () => {
  const notificationLog = await import('../../../../../app/repos/notification-log.js')
  logCreatedNotification = notificationLog.logCreatedNotification
  logRejectedNotification = notificationLog.logRejectedNotification

  const notificationStatus = await import('../../../../../app/messages/outbound/notification-status/publish.js')
  publishStatus = notificationStatus.publishStatus

  const notificationSender = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')
  sendNotification = notificationSender.sendNotification
}

const createMessage = (addresses) => ({
  data: {
    notifyTemplateId: 'mock-notify-template-id',
    commsAddresses: addresses,
    personalisation: {
      reference: 'mock-reference',
      agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
    },
    reference: 'mock-uuid'
  }
})

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

    await setupMocks()
  })

  test('should send an email with the correct arguments to a single email address', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')
    const message = createMessage('mock-email@test.com')
    mockSendEmail.mockResolvedValue({ data: { id: 'mock-notify-response-id' } })

    await sendNotification(message)

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
    const message = createMessage(['mock-email1@test.com', 'mock-email2@test.com'])

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
    const message = createMessage('mock-email@test.com')
    const mockError = new Error('Bad request - invalid input data')
    mockError.response = {
      status: StatusCodes.BAD_REQUEST,
      data: {
        errors: [{
          error: 'mock-error'
        }]
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await expect(sendNotification(message)).rejects.toThrow(mockError)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending email:', undefined, 'Bad request - invalid input data')

    uuidSpy.mockRestore()
  })

  test('should call logCreatedNotification when sendEmail is successful', async () => {
    const message = createMessage('mock-email@test.com')
    mockSendEmail.mockResolvedValue({
      data: {
        id: 'mock-notify-response-id'
      }
    })

    await sendNotification(message)

    expect(logCreatedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', 'mock-notify-response-id')
  })

  test('should call publishStatus when an email is sent', async () => {
    const message = createMessage('mock-email@test.com')
    mockSendEmail.mockResolvedValue({
      data: {
        id: 'mock-id'
      }
    })

    await sendNotification(message)

    expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', 'sending')
  })

  test('should call logRejectedNotification when sendEmail fails with non-500 error', async () => {
    const message = createMessage('mock-email@test.com')
    const mockError = new Error('Bad request - invalid input data')
    mockError.response = {
      status: StatusCodes.BAD_REQUEST,
      data: {
        errors: [{
          error: 'mock-error'
        }]
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await expect(sendNotification(message)).rejects.toThrow(mockError)
    expect(logRejectedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', mockError)
  })

  test('should call publishStatus with an error when email fails to send', async () => {
    const message = createMessage('mock-email@test.com')
    const mockError = new Error('Bad request - invalid input data')
    mockError.response = {
      status: StatusCodes.BAD_REQUEST,
      data: {
        errors: [{
          error: 'mock-error'
        }]
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await expect(sendNotification(message)).rejects.toThrow(mockError)
    expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', StatusCodes.BAD_REQUEST, mockError.response.data)
  })

  test('should throw NOTIFY_RETRY_ERROR and abandon message when notify returns a 500 status code', async () => {
    const message = createMessage('mock-email@test.com')
    const mockError = new Error('Internal server error')
    mockError.response = {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      data: {
        errors: [{
          error: 'mock-error'
        }]
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await expect(sendNotification(message, mockNotifyReceiver)).rejects.toThrow('NOTIFY_RETRY_ERROR')
    expect(logRejectedNotification).not.toHaveBeenCalled()
  })

  test('should handle non-500 errors without retrying', async () => {
    const message = createMessage('mock-email@test.com')
    const mockError = new Error('Bad request - invalid input data')
    mockError.response = {
      status: StatusCodes.BAD_REQUEST,
      data: {
        errors: [{
          error: 'mock-error'
        }]
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    await expect(sendNotification(message)).rejects.toThrow(mockError)
    expect(logRejectedNotification).toHaveBeenCalledWith(message, 'mock-email@test.com', mockError)
    expect(publishStatus).toHaveBeenCalledWith(message, 'mock-email@test.com', StatusCodes.BAD_REQUEST, mockError.response.data)
  })
})
