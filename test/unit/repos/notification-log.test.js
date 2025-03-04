import { jest } from '@jest/globals'
import notifyStatus from '../../../app/constants/notify-statuses.js'

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
      status: notifyStatus.CREATED,
      statusUpdatedAt: expect.any(Date),
      completed: null,
      recipient: 'mock-email@test.gov.uk'
    })
  })

  test('should log rejected notification', async () => {
    const message = { data: 'test message' }

    await logRejectedNotification(message, 'mock-email@test.gov.uk', 'test error')

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
        status: notifyStatus.CREATED,
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
        status: notifyStatus.CREATED,
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
        status: notifyStatus.CREATED
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
        status: notifyStatus.SENDING
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBe(true)
    })

    test('should return true if notification exists with status "delivered"', async () => {
      const mockNotification = {
        status: notifyStatus.DELIVERED
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBe(true)
    })

    test('should return false if notification exists with failure status', async () => {
      const mockNotification = {
        status: notifyStatus.PERMANENT_FAILURE
      }
      mockFindOne.mockResolvedValue(mockNotification)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBe(false)
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

    test('should return false when notification is not found', async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await checkDuplicateNotification('test-message-id', 'test@example.com')
      expect(result).toBe(false)
    })
  })
})
