<<<<<<< HEAD
import { jest, test } from '@jest/globals'

describe('Notification log repository', () => {
=======
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
>>>>>>> 434930-setup-db
  beforeEach(() => {
    jest.clearAllMocks()
  })

<<<<<<< HEAD
  test('should return sending and created notifications', async () => {
    jest.unstable_mockModule('../../../app/constants/mock-notification-log.js', () => ({
      default: [
        { id: '1', status: 'sending' },
        { id: '2', status: 'created' },
        { id: '3', status: 'delivered' }
      ]
    }))

    const { getPendingNotifications } = await import('../../../app/repos/notfication-log.js')

    const pending = getPendingNotifications()

    expect(pending).toEqual([
      { id: '1', status: 'sending' },
      { id: '2', status: 'created' }
    ])
  })

  test('should update notification status', async () => {
    const mockData = [
      { id: '1', status: 'sending' },
      { id: '2', status: 'created' },
      { id: '3', status: 'delivered' }
    ]

    jest.unstable_mockModule('../../../app/constants/mock-notification-log.js', () => ({
      default: mockData
    }))

    const { default: data } = await import('../../../app/constants/mock-notification-log.js')
    const { updateNotificationStatus } = await import('../../../app/repos/notfication-log.js')

    updateNotificationStatus({ id: '2', status: 'created' }, 'delivered')

    expect(data).toEqual([
      { id: '1', status: 'sending' },
      { id: '2', status: 'delivered' },
      { id: '3', status: 'delivered' }
    ])
  })

  test('should throw error if notification not found', async () => {
    const mockData = [
      { id: '1', status: 'sending' },
      { id: '2', status: 'created' },
      { id: '3', status: 'delivered' }
    ]

    jest.unstable_mockModule('../../../app/constants/mock-notification-log.js', () => ({
      default: mockData
    }))

    const { updateNotificationStatus } = await import('../../../app/repos/notfication-log.js')

    expect(() => {
      updateNotificationStatus({ id: '4', status: 'created' }, 'delivered')
    }).toThrow('Notification 4 not found in data')
=======
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

  test('should log error if logCreatedNotification call fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error')
    const message = { body: 'test message' }
    mockCreate.mockRejectedValue(new Error('test error'))

    await logCreatedNotification(message, '123456789')

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
>>>>>>> 434930-setup-db
  })
})
