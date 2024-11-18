import { jest } from '@jest/globals'

const mockReceiver = {
  completeMessage: jest.fn(),
  abandonMessage: jest.fn()
}

jest.unstable_mockModule('../../../app/messages/inbound/send-notification.js', () => ({
  sendNotification: jest.fn()
}))

const { sendNotification } = await import('../../../app/messages/inbound/send-notification.js')
const { handleMessage } = await import('../../../app/messages/inbound/handle-message.js')

describe('Handle Message', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call sendNotification', async () => {
    const message = { body: 'mock-message' }

    await handleMessage(message, mockReceiver)

    expect(sendNotification).toHaveBeenCalledWith(message.body)
  })

  test('should call completeMessage', async () => {
    const message = { body: 'mock-message' }

    await handleMessage(message, mockReceiver)

    expect(mockReceiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when sendNotification fails', async () => {
    const message = { body: 'mock-message' }
    const error = new Error('mock-error')
    sendNotification.mockRejectedValue(error)

    await handleMessage(message, mockReceiver)

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should throw an error when completeMessage fails', async () => {
    const message = { body: 'mock-message' }
    const error = new Error('mock-error')
    mockReceiver.completeMessage.mockRejectedValue(error)

    await handleMessage(message, mockReceiver)

    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })
})
