import { jest } from '@jest/globals'

const mockReceiver = {
  completeMessage: jest.fn()
}

jest.unstable_mockModule('../../../app/messages/send-notification.js', () => ({
  sendNotification: jest.fn()
}))

const { sendNotification } = await import('../../../app/messages/send-notification.js')
const { handleMessage } = await import('../../../app/messages/handle-message.js')

describe('Handle Message', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call sendNotification', async () => {
    const message = { body: 'mock-message' }

    await handleMessage(message, mockReceiver)

    expect(sendNotification).toHaveBeenCalledWith(message)
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

    await expect(handleMessage(message, mockReceiver))
      .rejects
      .toThrow('Message error')

    expect(mockReceiver.completeMessage).not.toHaveBeenCalled()
  })

  test('should throw an error when completeMessage fails', async () => {
    const message = { body: 'mock-message' }
    const error = new Error('mock-error')
    mockReceiver.completeMessage.mockRejectedValue(error)

    await expect(handleMessage(message, mockReceiver))
      .rejects
      .toThrow('Message error')
  })
})
