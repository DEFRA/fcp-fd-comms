import { MessageReceiver } from 'ffc-messaging'
import { startMessaging } from '../../../app/messages/index.js'
import { handleMessage } from '../../../app/messages/handle-message.js'

jest.mock('ffc-messaging')
jest.mock('../../../app/messages/handle-message.js')
jest.mock('../../../app/config/index.js', () => ({
  get: jest.fn((key) => {
    if (key === 'messageQueue') {
      return { host: 'localhost', username: 'user', password: 'pass' }
    }
    if (key === 'receiverSubscription') {
      return { address: 'test-address', topic: 'test-topic' }
    }
    return {}
  })
}))

describe('startMessaging', () => {
  let subscribeMock
  let completeMessageMock
  let receiverInstance

  beforeEach(() => {
    jest.clearAllMocks()

    completeMessageMock = jest.fn()
    subscribeMock = jest.fn()
    receiverInstance = {
      completeMessage: completeMessageMock,
      subscribe: subscribeMock
    }

    MessageReceiver.mockImplementation(() => receiverInstance)
  })

  test('should create a MessageReceiver and subscribe', async () => {
    await startMessaging()

    expect(MessageReceiver).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        username: 'user',
        password: 'pass'
      }),
      expect.any(Function)
    )

    expect(subscribeMock).toHaveBeenCalled()
    console.info('Service is ready to consume messages')
  })

  test('should call handleMessage when a message is received', async () => {
    const message = { id: 1, content: 'test' }

    const receiverAction = MessageReceiver.mock.calls[0][1]
    await receiverAction(message)

    expect(handleMessage).toHaveBeenCalledWith(message, receiverInstance)
  })
})
