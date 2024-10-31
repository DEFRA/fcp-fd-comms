import { jest } from '@jest/globals'

const mockGetNotificationById = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    getNotificationById: mockGetNotificationById
  }))
}))

const { getNotifyStatus } = await import('../../../../app/jobs/check-notify-status/get-notify-status.js')

describe('Get status from notify API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call notify API with notification ID', async () => {
    mockGetNotificationById.mockResolvedValue({
      data: {
        id: '123',
        status: 'delivered'
      }
    })

    await getNotifyStatus('123')

    expect(mockGetNotificationById).toHaveBeenCalledWith('123')
  })

  test('should return status from notify API', async () => {
    mockGetNotificationById.mockResolvedValue({
      data: {
        id: '123',
        status: 'delivered'
      }
    })

    const { status } = await getNotifyStatus('123')

    expect(status).toBe('delivered')
  })
})
