import { jest } from '@jest/globals'

const mockCreate = jest.fn()
const mockFindOne = jest.fn()
const mockFailureFindOne = jest.fn()

jest.unstable_mockModule('../../../app/data/index.js', () => ({
  default: {
    notifyApiRequestSuccess: {
      create: mockCreate,
      findOne: mockFindOne
    },
    notifyApiRequestFailure: {
      create: mockCreate,
      findOne: mockFailureFindOne
    }
  }
}))

jest.unstable_mockModule('../../../app/constants/notify-statuses.js', () => ({
  default: {
    CREATED: 'created',
    SENDING: 'sending',
    DELIVERED: 'delivered'
  }
}))

const {
  logCreatedNotification,
  logRejectedNotification,
  updateNotificationStatus,
  checkDuplicateNotification
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

    await logCreatedNotification(message, 'mock-email@test.gov.uk', '123456789')

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      notifyResponseId: '123456789',
      message,
      status: 'created',
      statusUpdatedAt: expect.any(Date),
      completed: null,
      recipient: 'mock-email@test.gov.uk'
    })
  })

  test('should log rejected notification', async () => {
    const message = { data: 'test message' }

    await logRejectedNotification(message, 'mock-email@test.gov.uk', { response: { data: 'test error' } })

    expect(mockCreate).toHaveBeenCalledWith({
      createdAt: expect.any(Date),
      message,
      error: 'test error',
      recipient: 'mock-email@test.gov.uk'
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

  describe('checkDuplicateNotification', () => {
    test('should return true if notification exists with status "created"', async () => {
      const mockNotification = {
        notifyResponseId: '123456789',
        message: {
          id: 'test-message-id'
        },
        recipient: 'test@example.com',
        status: 'created'
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
      expect(result).toBe(true)
    })

    test('should return true if notification exists with status "sending"', async () => {
      const mockNotification = {
        status: 'sending'
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBe(true)
    })

    test('should return true if notification exists with status "delivered"', async () => {
      const mockNotification = {
        status: 'delivered'
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBe(true)
    })

    test('should return undefined if notification exists with failure status', async () => {
      const mockNotification = {
        status: 'permanent-failure'
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBeUndefined()
    })

    test('should handle database errors appropriately', async () => {
      const mockError = new Error('Database connection failed')
      mockFindOne.mockRejectedValue(mockError)

      await expect(checkDuplicateNotification('test-message-id', 'test@example.com'))
        .rejects.toThrow('Database connection failed')

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
    })

    test('should return undefined when notification is not found', async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBeUndefined()
    })
  })
})
