import { jest } from '@jest/globals'

const mockHandleCommsRequest = jest.fn()

jest.unstable_mockModule('../../../../app/messages/inbound/comms-request/index.js', () => ({
  handleCommsRequest: mockHandleCommsRequest
}))

jest.mock('ffc-messaging', () => {
  const mockSubscribe = jest.fn()
  return {
    MessageReceiver: jest.fn(() => ({
      subscribe: mockSubscribe
    }))
  }
})

describe('Start Messaging', () => {
  test('should create a MessageReceiver', async () => {
    const { MessageReceiver } = await import('ffc-messaging')
    const { startMessaging } = await import('../../../../app/messages/inbound/index.js')
    await startMessaging()
    expect(MessageReceiver).toHaveBeenCalled()
  })

  test('should call subscribe on the MessageReceiver instance', async () => {
    const { MessageReceiver } = await import('ffc-messaging')
    const { startMessaging } = await import('../../../../app/messages/inbound/index.js')
    await startMessaging()
    expect(MessageReceiver.mock.calls[0][1]).toBeInstanceOf(Function)
  })

  test('should pass a callback to the MessageReceiver that calls handleMessage', async () => {
    const { MessageReceiver } = await import('ffc-messaging')
    const { startMessaging } = await import('../../../../app/messages/inbound/index.js')
    await startMessaging()

    const mockMessage = { body: 'This is a mock message.' }
    const messageCallback = MessageReceiver.mock.calls[0][1]

    await messageCallback(mockMessage)

    expect(mockHandleCommsRequest).toHaveBeenCalledWith(
      mockMessage,
      expect.objectContaining({ subscribe: expect.any(Function) })
    )
  })
})
