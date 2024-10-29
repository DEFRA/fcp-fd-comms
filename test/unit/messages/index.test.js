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
})
