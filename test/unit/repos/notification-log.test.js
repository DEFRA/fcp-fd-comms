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

    await logCreatedNotification(message, 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66')

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
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

  test('should log error if logCreatedNotification call fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error')
    const message = { body: 'test message' }
    mockCreate.mockRejectedValue(new Error('test error'))

    await logCreatedNotification(message, 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66')

    expect(consoleSpy).toHaveBeenCalledTimes(1)

    consoleSpy.mockRestore()
  })

  test('should log error if logRejectedNotification call fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error')
    const message = { body: 'test message' }
    mockCreate.mockRejectedValue(new Error('test error'))

    await logRejectedNotification(message, { response: { data: 'test error' } })

    expect(consoleSpy).toHaveBeenCalledTimes(1)

    consoleSpy.mockRestore()
  })
})
