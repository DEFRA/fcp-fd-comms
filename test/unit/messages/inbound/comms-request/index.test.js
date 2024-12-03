import { jest } from '@jest/globals'

const mockReceiver = {
  completeMessage: jest.fn(),
  abandonMessage: jest.fn()
}

jest.unstable_mockModule('../../../../../app/messages/outbound/notification-status/index.js', () => ({
  publishReceived: jest.fn()
}))

jest.unstable_mockModule('../../../../../app/messages/inbound/comms-request/send-notification.js', () => ({
  sendNotification: jest.fn()
}))

const { publishReceived } = await import('../../../../../app/messages/outbound/notification-status/index.js')
const { sendNotification } = await import('../../../../../app/messages/inbound/comms-request/send-notification.js')
const { handleCommsRequest } = await import('../../../../../app/messages/inbound/comms-request/index.js')

describe('Handle Message', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call publishReceived', async () => {
    const message = { body: 'mock-message' }

    await handleCommsRequest(message, mockReceiver)

    expect(publishReceived).toHaveBeenCalledWith(message.body)
  })

  test('should call sendNotification', async () => {
    const message = { body: 'mock-message' }

    await handleCommsRequest(message, mockReceiver)

    expect(sendNotification).toHaveBeenCalledWith(message.body)
  })

  test('should call completeMessage', async () => {
    const message = { body: 'mock-message' }

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when publishReceived fails', async () => {
    const message = { body: 'mock-message' }
    const error = new Error('mock-error')
    publishReceived.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when sendNotification fails', async () => {
    const message = { body: 'mock-message' }
    const error = new Error('mock-error')
    sendNotification.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when completeMessage fails', async () => {
    const message = { body: 'mock-message' }
    const error = new Error('mock-error')
    mockReceiver.completeMessage.mockRejectedValue(error)

    await handleCommsRequest(message, mockReceiver)

    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })
})
