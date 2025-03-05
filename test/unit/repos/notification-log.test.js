import { jest, test } from '@jest/globals'
import notifyStatus from '../../../app/constants/notify-statuses.js'
import commsMessage from '../../mocks/comms-message.js'

const mockCreate = jest.fn()
const mockFindOneSuccess = jest.fn()
const mockFindOneFailure = jest.fn()

jest.unstable_mockModule('../../../app/data/index.js', () => ({
  default: {
    notifyApiRequestSuccess: {
      create: mockCreate,
      findOne: mockFindOneSuccess
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

      mockFindOneSuccess.mockResolvedValue(notification)

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

      mockFindOneSuccess.mockResolvedValue(notification)

      await updateNotificationStatus('f824cbfa-f75c-40bb-8407-8edb0cc469d3', status)

      expect(notification.completed).toEqual(new Date('2024-01-01T15:00:00.000Z'))
    }
  )

  describe('idempotent requests', () => {
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
  })
})
