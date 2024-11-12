import { jest } from '@jest/globals'
const mockCreate = jest.fn()

jest.unstable_mockModule('../../../app/data/index.js', () => ({
  default: {
    notifyApiRequestSuccess: {
      create: mockCreate
    },
    notifyApiRequestFailure: {
      create: mockCreate
    }
  }
}))

const { logCreatedNotification, logRejectedNotification } = await import('../../../app/repos/notification-log.js')

describe('Notification Log Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should log created notification', async () => {
    const message = { body: 'test message' }

    await logCreatedNotification(message, '123456789')

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      notifyResponseId: '123456789',
      message: message.body,
      status: 'created',
      statusUpdatedAt: expect.any(Date),
      completed: null
    })
  })

  test('should log rejected notification', async () => {
    const message = { body: 'test message' }

    await logRejectedNotification(message, { response: { data: 'test error' } })

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      message: message.body,
      error: 'test error'
    })
  })
})
