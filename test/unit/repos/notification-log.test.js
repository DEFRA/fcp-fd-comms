import { jest, test, expect, describe, beforeAll, beforeEach } from '@jest/globals'
import notifyStatus from '../../../app/constants/notify-statuses.js'
import commsMessage from '../../mocks/comms-message.js'

const mockCreate = jest.fn()
const mockFindOneSuccess = jest.fn()
const mockFindOneFailure = jest.fn()
const mockFindAll = jest.fn()
const mockSave = jest.fn()

jest.unstable_mockModule('../../../app/data/index.js', () => ({
  default: {
    notifyApiRequestSuccess: {
      create: mockCreate,
      findOne: mockFindOneSuccess,
      findAll: mockFindAll
    },
    notifyApiRequestFailure: {
      create: mockCreate,
      findOne: mockFindOneFailure
    }
  }
}))

const {
  logCreatedNotification,
  logRejectedNotification,
  updateNotificationStatus,
  checkDuplicateNotification,
  getPendingNotifications,
  getOriginalNotificationRequest
} = await import('../../../app/repos/notification-log.js')

describe('Notification Log Repository', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern')
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('logCreatedNotification', () => {
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

    test('should throw DatabaseError when database operation fails', async () => {
      const message = { data: 'test message' }
      const dbError = new Error('Database connection failed')

      mockCreate.mockRejectedValue(dbError)

      await expect(logCreatedNotification(message, 'mock-email@test.gov.uk', '123456789'))
        .rejects.toThrow('Failed to log created notification: Database connection failed')
    })
  })

  describe('logRejectedNotification', () => {
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

    test('should throw DatabaseError when database operation fails', async () => {
      const message = { data: 'test message' }
      const dbError = new Error('Database connection failed')

      mockCreate.mockRejectedValue(dbError)

      await expect(logRejectedNotification(message, 'mock-email@test.gov.uk', 'test error'))
        .rejects.toThrow('Failed to log rejected notification: Database connection failed')
    })
  })

  describe('updateNotificationStatus', () => {
    test.each(['created', 'sending'])(
      'should not complete notification if status is %s',
      async (status) => {
        const notification = {
          save: mockSave,
          status: notifyStatus.CREATED,
          statusUpdatedAt: new Date(),
          completed: null
        }

        mockFindOneSuccess.mockResolvedValue(notification)

        await updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', status)

        expect(notification.completed).toBeNull()
        expect(mockSave).toHaveBeenCalled()
      }
    )

    test.each(['delivered', 'permanent-failure', 'temporary-failure', 'technical-failure'])(
      'should complete notification if status is %s',
      async (status) => {
        jest.setSystemTime(new Date('2024-01-01T15:00:00.000Z'))

        const notification = {
          save: mockSave,
          status: notifyStatus.CREATED,
          statusUpdatedAt: new Date(),
          completed: null
        }

        mockFindOneSuccess.mockResolvedValue(notification)

        await updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', status)

        expect(notification.completed).toEqual(new Date('2024-01-01T15:00:00.000Z'))
        expect(mockSave).toHaveBeenCalled()
      }
    )

    test('should throw DatabaseError when notification not found', async () => {
      mockFindOneSuccess.mockResolvedValue(null)

      await expect(updateNotificationStatus('non-existent-id', 'delivered'))
        .rejects.toThrow('No notification found for ID: non-existent-id')
    })

    test('should throw DatabaseError when database operation fails', async () => {
      const dbError = new Error('Database connection failed')
      mockFindOneSuccess.mockRejectedValue(dbError)

      await expect(updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', 'delivered'))
        .rejects.toThrow('Failed to update notification status: Database connection failed')
    })

    test('should throw DatabaseError when save fails', async () => {
      const notification = {
        save: mockSave,
        status: notifyStatus.CREATED,
        statusUpdatedAt: new Date(),
        completed: null
      }
      const saveError = new Error('Save failed')

      mockFindOneSuccess.mockResolvedValue(notification)
      mockSave.mockRejectedValue(saveError)

      await expect(updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', 'delivered'))
        .rejects.toThrow('Failed to update notification status: Save failed')
    })
  })

  describe('checkDuplicateNotification', () => {
    test('should return false if message id is not found', async () => {
      mockFindOneSuccess.mockResolvedValue(null)
      mockFindOneFailure.mockResolvedValue(null)

      const result = await checkDuplicateNotification('ca7e7b05-109b-4cf3-a787-d3a985984e91')

      expect(mockFindOneSuccess).toHaveBeenCalledWith({
        where: {
          'message.id': 'ca7e7b05-109b-4cf3-a787-d3a985984e91'
        }
      })

      expect(result).toBe(false)
    })

    test('should return true if message id is found in success log', async () => {
      mockFindOneSuccess.mockResolvedValue({
        correlationId: 1,
        createdAt: '2023-10-17T14:48:00.000Z',
        notifyResponseId: '350eef82-69ee-4170-892d-2bf340f6b5e3',
        status: 'delivered',
        message: {
          ...commsMessage,
          id: 'ca7e7b05-109b-4cf3-a787-d3a985984e91'
        },
        recipient: 'test@example.com'
      })

      const duplicate = await checkDuplicateNotification('ca7e7b05-109b-4cf3-a787-d3a985984e91')

      expect(mockFindOneSuccess).toHaveBeenCalledWith({
        where: {
          'message.id': 'ca7e7b05-109b-4cf3-a787-d3a985984e91'
        }
      })

      expect(duplicate).toBe(true)
    })

    test('should return true if message id is found in failure log', async () => {
      mockFindOneFailure.mockResolvedValue({
        correlationId: 1,
        createdAt: '2023-10-17T14:48:00.000Z',
        message: {
          ...commsMessage,
          id: 'ca7e7b05-109b-4cf3-a787-d3a985984e91'
        },
        recipient: 'test@example.com',
        error: {}
      })

      const duplicate = await checkDuplicateNotification('ca7e7b05-109b-4cf3-a787-d3a985984e91')

      expect(mockFindOneFailure).toHaveBeenCalledWith({
        where: {
          'message.id': 'ca7e7b05-109b-4cf3-a787-d3a985984e91'
        }
      })

      expect(duplicate).toBe(true)
    })

    test('should throw DatabaseError when database operation fails', async () => {
      const dbError = new Error('Database connection failed')
      mockFindOneSuccess.mockRejectedValue(dbError)

      await expect(checkDuplicateNotification('ca7e7b05-109b-4cf3-a787-d3a985984e91'))
        .rejects.toThrow('Failed to check duplicate notification: Database connection failed')
    })
  })

  describe('getPendingNotifications', () => {
    test('should return mapped pending notifications', async () => {
      const mockNotifications = [
        {
          notifyResponseId: '123',
          status: 'sending',
          createdAt: new Date('2024-01-01'),
          message: { id: 'msg1' },
          recipient: 'test1@example.com'
        },
        {
          notifyResponseId: '456',
          status: 'created',
          createdAt: new Date('2024-01-02'),
          message: { id: 'msg2' },
          recipient: 'test2@example.com'
        }
      ]

      mockFindAll.mockResolvedValue(mockNotifications)

      const result = await getPendingNotifications()

      expect(mockFindAll).toHaveBeenCalledWith({
        where: {
          completed: null
        }
      })

      expect(result).toEqual([
        {
          id: '123',
          status: 'sending',
          createdAt: new Date('2024-01-01'),
          message: { id: 'msg1' },
          recipient: 'test1@example.com'
        },
        {
          id: '456',
          status: 'created',
          createdAt: new Date('2024-01-02'),
          message: { id: 'msg2' },
          recipient: 'test2@example.com'
        }
      ])
    })

    test('should throw DatabaseError when database operation fails', async () => {
      const dbError = new Error('Database connection failed')
      mockFindAll.mockRejectedValue(dbError)

      await expect(getPendingNotifications())
        .rejects.toThrow('Failed to get pending notifications: Database connection failed')
    })
  })

  describe('getOriginalNotificationRequest', () => {
    test('should return original notification request', async () => {
      const mockNotification = {
        notifyResponseId: '123',
        createdAt: new Date('2024-01-01'),
        status: 'delivered',
        message: { id: 'correlation-id' },
        recipient: 'test@example.com'
      }

      mockFindOneSuccess.mockResolvedValue(mockNotification)

      const result = await getOriginalNotificationRequest('correlation-id')

      expect(mockFindOneSuccess).toHaveBeenCalledWith({
        where: {
          'message.id': 'correlation-id'
        }
      })

      expect(result).toEqual({
        id: '123',
        createdAt: new Date('2024-01-01'),
        status: 'delivered',
        message: { id: 'correlation-id' },
        recipient: 'test@example.com'
      })
    })

    test('should throw DatabaseError when notification not found', async () => {
      mockFindOneSuccess.mockResolvedValue(null)

      await expect(getOriginalNotificationRequest('non-existent-id'))
        .rejects.toThrow('No notification found for correlation ID: non-existent-id')
    })

    test('should throw DatabaseError when database operation fails', async () => {
      const dbError = new Error('Database connection failed')
      mockFindOneSuccess.mockRejectedValue(dbError)

      await expect(getOriginalNotificationRequest('correlation-id'))
        .rejects.toThrow('Failed to get original notification request: Database connection failed')
    })
  })
})
