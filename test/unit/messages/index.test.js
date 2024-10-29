import { jest } from '@jest/globals'

jest.mock('ffc-messaging', () => {
  const mockSubscribe = jest.fn()
  return {
    MessageReceiver: jest.fn(() => ({
      subscribe: mockSubscribe
    }))
  }
})

describe('Start Messaging', () => {
  test('should create a MessageReceiver and subscribe', async () => {
    const { MessageReceiver } = await import('ffc-messaging')
    const { startMessaging } = await import('../../../app/messages/index.js')
    await startMessaging()

    expect(MessageReceiver).toHaveBeenCalled()
    expect(MessageReceiver.mock.calls[0][1]).toBeInstanceOf(Function)
  })

  test('should call handleMessage when a message is received', async () => {
    const { MessageReceiver } = await import('ffc-messaging')
    const { startMessaging } = await import('../../../app/messages/index.js')
    const { handleMessage } = await import('../../../app/messages/handle-message.js')
    const message = { id: 1, content: 'mock content' }

    await startMessaging()
    const receiverAction = MessageReceiver.mock.calls[0][1]
    await receiverAction(message)

    expect(handleMessage).toHaveBeenCalledWith(message, expect.any(Object))
  })
})
