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

const {
  logCreatedNotification,
  logRejectedNotification,
  updateNotificationStatus,
  findSuccessNotificationByIdAndEmail,
  findFailNotificationByIdAndEmail
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

  describe('findSuccessNotificationByIdAndEmail', () => {
    test('should return existing notification when found', async () => {
      const mockNotification = {
        notifyResponseId: '123456789',
        message: {
          id: 'test-message-id'
        },
        recipient: 'test@example.com',
        status: 'created'
      }

      mockFindOne.mockResolvedValue(mockNotification)

      const result = await findSuccessNotificationByIdAndEmail('test-message-id', 'test@example.com')

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
      expect(result).toEqual(mockNotification)
    })

    test('should return null when notification is not found', async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await findSuccessNotificationByIdAndEmail('test-message-id', 'test@example.com')

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
      expect(result).toBeNull()
    })

    test('should handle database errors appropriately', async () => {
      const mockError = new Error('Database connection failed')
      mockFindOne.mockRejectedValue(mockError)

      await expect(findSuccessNotificationByIdAndEmail('test-message-id', 'test@example.com'))
        .rejects.toThrow('Database connection failed')

      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
    })
  })

  describe('findFailNotificationByIdAndEmail', () => {
    test('should return existing failed notification when found', async () => {
      const mockNotification = {
        message: {
          id: 'test-message-id'
        },
        recipient: 'test@example.com',
        error: 'some error'
      }

      mockFailureFindOne.mockResolvedValue(mockNotification)

      const result = await findFailNotificationByIdAndEmail('test-message-id', 'test@example.com')

      expect(mockFailureFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
      expect(result).toEqual(mockNotification)
    })

    test('should return null when failed notification is not found', async () => {
      mockFailureFindOne.mockResolvedValue(null)

      const result = await findFailNotificationByIdAndEmail('test-message-id', 'test@example.com')

      expect(mockFailureFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
      expect(result).toBeNull()
    })

    test('should handle database errors appropriately', async () => {
      const mockError = new Error('Database connection failed')
      mockFailureFindOne.mockRejectedValue(mockError)

      await expect(findFailNotificationByIdAndEmail('test-message-id', 'test@example.com'))
        .rejects.toThrow('Database connection failed')

      expect(mockFailureFindOne).toHaveBeenCalledWith({
        where: {
          'message.id': 'test-message-id',
          recipient: 'test@example.com'
        }
      })
    })
  })
})
