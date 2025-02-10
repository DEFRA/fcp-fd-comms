import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../app/repos/notification-log.js', () => ({
  findSuccessNotificationByIdAndEmail: jest.fn(),
  findFailNotificationByIdAndEmail: jest.fn()
}))

jest.unstable_mockModule('../../../app/constants/notify-statuses.js', () => ({
  default: {
    SENDING: 'sending',
    DELIVERED: 'delivered',
    CREATED: 'created',
    PERMANENT_FAILURE: 'permanent-failure',
    TEMPORARY_FAILURE: 'temporary-failure',
    TECHNICAL_FAILURE: 'technical-failure',
    INTERNAL_FAILURE: 'internal-failure',
    VALIDATION_FAILURE: 'validation-failure'
  }
}))

const { findSuccessNotificationByIdAndEmail, findFailNotificationByIdAndEmail } = await import('../../../app/repos/notification-log.js')
const { checkDuplicateNotification } = await import('../../../app/utils/check-duplicate-notification.js')

describe('checkDuplicateNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
  })

  const mockMessage = {
    id: 'test-message-id',
    data: {
      content: 'test content'
    }
  }

  describe('single email address', () => {
    test('should throw error when notification exists with status "sending"', async () => {
      const existingNotification = {
        id: 'notification-id',
        status: 'sending'
      }
      findSuccessNotificationByIdAndEmail.mockResolvedValue(existingNotification)

      await expect(checkDuplicateNotification(mockMessage, 'test@example.com'))
        .rejects.toThrow('Duplicate notification detected')

      expect(findSuccessNotificationByIdAndEmail).toHaveBeenCalledWith('test-message-id', 'test@example.com')
      expect(findFailNotificationByIdAndEmail).not.toHaveBeenCalled()
    })

    test('should throw error when notification exists with status "delivered"', async () => {
      const existingNotification = {
        id: 'notification-id',
        status: 'delivered'
      }
      findSuccessNotificationByIdAndEmail.mockResolvedValue(existingNotification)

      await expect(checkDuplicateNotification(mockMessage, 'test@example.com'))
        .rejects.toThrow('Duplicate notification detected')
    })

    test('should throw error when notification exists with status "created"', async () => {
      const existingNotification = {
        id: 'notification-id',
        status: 'created'
      }
      findSuccessNotificationByIdAndEmail.mockResolvedValue(existingNotification)

      await expect(checkDuplicateNotification(mockMessage, 'test@example.com'))
        .rejects.toThrow('Duplicate notification detected')
    })

    test('should check for failed notification when no success notification exists', async () => {
      findSuccessNotificationByIdAndEmail.mockResolvedValue(null)
      findFailNotificationByIdAndEmail.mockResolvedValue(null)

      await checkDuplicateNotification(mockMessage, 'test@example.com')

      expect(findSuccessNotificationByIdAndEmail).toHaveBeenCalledWith('test-message-id', 'test@example.com')
      expect(findFailNotificationByIdAndEmail).toHaveBeenCalledWith('test-message-id', 'test@example.com')
    })

    test('should allow resend when failed notification exists', async () => {
      findSuccessNotificationByIdAndEmail.mockResolvedValue(null)
      findFailNotificationByIdAndEmail.mockResolvedValue({ id: 'failed-notification-id' })

      const result = await checkDuplicateNotification(mockMessage, 'test@example.com')

      expect(result).toBeNull()
      expect(console.log).toHaveBeenCalledWith('resending failed notification')
    })
  })

  describe('multiple email addresses', () => {
    const emailAddresses = ['test1@example.com', 'test2@example.com']

    test('should check each email address for duplicates', async () => {
      findSuccessNotificationByIdAndEmail.mockResolvedValue(null)
      findFailNotificationByIdAndEmail.mockResolvedValue(null)

      await checkDuplicateNotification(mockMessage, emailAddresses)

      expect(findSuccessNotificationByIdAndEmail).toHaveBeenCalledTimes(2)
      expect(findSuccessNotificationByIdAndEmail).toHaveBeenCalledWith('test-message-id', 'test1@example.com')
      expect(findSuccessNotificationByIdAndEmail).toHaveBeenCalledWith('test-message-id', 'test2@example.com')
    })

    test('should throw error if any email has an active notification', async () => {
      findSuccessNotificationByIdAndEmail
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'notification-id', status: 'sending' })

      await expect(checkDuplicateNotification(mockMessage, emailAddresses))
        .rejects.toThrow('Duplicate notification detected')

      expect(findSuccessNotificationByIdAndEmail).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    test('should handle database errors from findSuccessNotificationByIdAndEmail', async () => {
      const dbError = new Error('Database error')
      findSuccessNotificationByIdAndEmail.mockRejectedValue(dbError)

      await expect(checkDuplicateNotification(mockMessage, 'test@example.com'))
        .rejects.toThrow('Database error')
    })

    test('should handle database errors from findFailNotificationByIdAndEmail', async () => {
      findSuccessNotificationByIdAndEmail.mockResolvedValue(null)
      const dbError = new Error('Database error')
      findFailNotificationByIdAndEmail.mockRejectedValue(dbError)

      await expect(checkDuplicateNotification(mockMessage, 'test@example.com'))
        .rejects.toThrow('Database error')
    })
  })
})
