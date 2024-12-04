import { jest, test } from '@jest/globals'
import commsMessage from '../../../../mocks/comms-message.js'

const mockReceiver = {
  completeMessage: jest.fn(),
  abandonMessage: jest.fn(),
  deadLetterMessage: jest.fn()
}

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-status/index.js', () => ({
  publishReceived: jest.fn(),
  publishInvalidRequest: jest.fn()
}))

jest.unstable_mockModule('../../../../../app/messages/inbound/comms-request/send-notification.js', () => ({
  sendNotification: jest.fn()
}))

const { publishReceived } = await import('../../../../../app/messages/outbound/notification-status/index.js')
const { publishInvalidRequest } = await import('../../../../../app/messages/outbound/notification-status/index.js')
const { sendNotification } = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')
const { handleCommsRequest } = await import('../../../../../app/messages/inbound/comms-request/index.js')

describe('Handle Message', () => {
  beforeEach(() => {
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

    expect(sendNotification).toHaveBeenCalledWith(message.body)
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
    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when sendNotification fails', async () => {
    const message = { body: commsMessage }
    const error = new Error('mock-error')
    sendNotification.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when completeMessage fails', async () => {
    const message = { body: commsMessage }
    const error = new Error('mock-error')
    mockReceiver.completeMessage.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should call publishInvalidRequest when validation fails', async () => {
    const message = { body: {} }

    await handleCommsRequest(message, mockReceiver)

    expect(publishInvalidRequest).toHaveBeenCalledWith(message.body, expect.arrayContaining([
      expect.objectContaining({
        type: 'ValidationError',
        message: expect.any(String)
      })
    ]))
  })

  test('should not call publishInvalidRequest when validation success', async () => {
    const message = { body: commsMessage }

    await handleCommsRequest(message, mockReceiver)

    expect(publishInvalidRequest).not.toHaveBeenCalled()
  })

  test('should dead letter message when validation fails', async () => {
    const message = { body: {} }

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test('should console error if message is invalid', async () => {
    const message = {
      body: {
        ...commsMessage,
        data: {
          ...commsMessage.data,
          sbi: '1'
        }
      }
    }

    const consoleErrorSpy = jest.spyOn(console, 'error')

    await handleCommsRequest(message, mockReceiver)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error validating message: ',
      [{ type: 'ValidationError', message: '"data.sbi" must be greater than or equal to 105000000' }]
    )
  })
})
