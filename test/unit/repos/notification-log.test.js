import { jest, test } from '@jest/globals'

describe('Notification log repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
})
