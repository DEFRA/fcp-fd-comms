import { expect, jest, test } from '@jest/globals'
import commsMessage from '../../../../mocks/comms-message.js'

let mockReceiver

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-status/publish.js', () => ({
  publishReceived: jest.fn(),
  publishInvalidRequest: jest.fn()
}))

jest.unstable_mockModule('../../../../../app/messages/inbound/comms-request/send-notification.js', () => ({
  sendNotification: jest.fn()
}))

const { publishReceived } = await import('../../../../../app/messages/outbound/notification-status/publish.js')
const { publishInvalidRequest } = await import('../../../../../app/messages/outbound/notification-status/publish.js')
const { sendNotification } = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')
const { handleCommsRequest } = await import('../../../../../app/messages/inbound/comms-request/handler.js')

describe('Handle Message', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    mockReceiver = {
      completeMessage: jest.fn(),
      abandonMessage: jest.fn(),
      deadLetterMessage: jest.fn()
    }
    consoleLogSpy = jest.spyOn(console, 'log')
    consoleErrorSpy = jest.spyOn(console, 'error')
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    jest.clearAllMocks()
  })

  test('should call publishReceived', async () => {
    const message = { body: commsMessage }

    await handleCommsRequest(message, mockReceiver)

    expect(publishReceived).toHaveBeenCalledWith(message.body)
  })

  test('should call sendNotification', async () => {
    const message = { body: commsMessage }

    await handleCommsRequest(message, mockReceiver)

    expect(sendNotification).toHaveBeenCalledWith(message.body, mockReceiver)
  })

  test('should call completeMessage', async () => {
    const message = { body: commsMessage }

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when publishReceived fails', async () => {
    const message = { body: commsMessage }
    const error = new Error('mock-error')
    publishReceived.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when sendNotification fails', async () => {
    const message = { body: commsMessage }
    const error = new Error('mock-error')
    sendNotification.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when completeMessage fails', async () => {
    const message = { body: commsMessage }
    const error = new Error('mock-error')
    mockReceiver.completeMessage.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test.skip('should call publishInvalidRequest when validation fails', async () => {
    const message = {
      body: {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          sbi: '1'
        }
      }
    }

    await handleCommsRequest(message, mockReceiver)

    expect(publishInvalidRequest).toHaveBeenCalledWith(message.body, expect.arrayContaining([
      expect.objectContaining({
        error: 'ValidationError',
        message: expect.any(String)
      })
    ]))

    expect(publishReceived).not.toHaveBeenCalled()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  test.skip('should not continue processing if message is invalid', async () => {
    const message = { body: {} }

    await handleCommsRequest(message, mockReceiver)

    expect(publishReceived).not.toHaveBeenCalled()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  test.skip('should not call publishInvalidRequest when validation success', async () => {
    const message = { body: commsMessage }

    await handleCommsRequest(message, mockReceiver)

    expect(publishInvalidRequest).not.toHaveBeenCalled()
  })

  test.skip('should dead letter message if no request id', async () => {
    const message = { body: 'invalid' }

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test.skip('should console error if no request id', async () => {
    const message = { body: 'invalid' }

    await handleCommsRequest(message, mockReceiver)

    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid comms request received. Request ID:', undefined)
    expect(consoleErrorSpy).toHaveBeenCalledWith('No ID provided in message. Cannot publish invalid request to data layer.')
  })

  test.skip('should dead letter message when validation fails', async () => {
    const message = { body: {} }

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test.skip('should console error if message is invalid', async () => {
    const message = {
      body: {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          sbi: '1'
        }
      }
    }

    await handleCommsRequest(message, mockReceiver)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid comms request received. Request ID:',
      '79389915-7275-457a-b8ca-8bf206b2e67b'
    )
  })

  test('should abandon message when sendNotification throws NOTIFY_RETRY_ERROR', async () => {
    const message = {
      body: {
        data: {
          commsAddresses: ['mock-email@test.com']
        }
      }
    }

    publishReceived.mockResolvedValueOnce()

    const error = new Error('NOTIFY_RETRY_ERROR')
    error.response = {
      status: 500,
      data: {
        errors: [{
          error: 'Internal server error'
        }]
      }
    }

    sendNotification.mockRejectedValueOnce(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.deadLetterMessage).not.toHaveBeenCalled()
  })

  test('should rethrow non-NOTIFY_RETRY_ERROR errors from sendNotification', async () => {
    const message = {
      body: {
        data: {
          commsAddresses: ['mock-email@test.com']
        }
      }
    }

    publishReceived.mockResolvedValueOnce()

    const error = new Error('Some other error')
    sendNotification.mockRejectedValueOnce(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.abandonMessage).not.toHaveBeenCalled()
    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error handling message: ', error)
  })
})
