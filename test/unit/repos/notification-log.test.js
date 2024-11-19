import { jest } from '@jest/globals'

const mockCreate = jest.fn()
const mockFindOne = jest.fn()

jest.unstable_mockModule('../../../app/data/index.js', () => ({
  default: {
    notifyApiRequestSuccess: {
      create: mockCreate,
      findOne: mockFindOne
    },
    notifyApiRequestFailure: {
      create: mockCreate
    }
  }
}))

const {
  logCreatedNotification,
  logRejectedNotification,
  updateNotificationStatus
} = await import('../../../app/repos/notification-log.js')

describe('Notification Log Repository', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should log created notification', async () => {
    const message = { data: 'test message' }

    await logCreatedNotification(message, '123456789')

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      notifyResponseId: '123456789',
      message,
      status: 'created',
      statusUpdatedAt: expect.any(Date),
      completed: null
    })
  })

  test('should log rejected notification', async () => {
    const message = { data: 'test message' }

    await logRejectedNotification(message, { response: { data: 'test error' } })

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      message,
      error: 'test error'
    })
  })

  test.each(['created', 'sending'])(
    'should not complete notification if status is %s',
    async (status) => {
      const notification = {
        save: jest.fn(),
        status: 'created',
        statusUpdatedAt: new Date(),
        completed: null
      }

      mockFindOne.mockResolvedValue(notification)

      await updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', status)

      expect(notification.completed).toBeNull()
    }
  )

  test.each(['delivered', 'permanent-failure', 'temporary-failure', 'technical-failure'])(
    'should complete notification if status is %s',
    async (status) => {
      jest.setSystemTime(new Date('2024-01-01T15:00:00.000Z'))

      const notification = {
        save: jest.fn(),
        status: 'created',
        statusUpdatedAt: new Date(),
        completed: null
      }

      mockFindOne.mockResolvedValue(notification)

      await updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', status)

      expect(notification.completed).toEqual(new Date('2024-01-01T15:00:00.000Z'))
    }
  )
})
