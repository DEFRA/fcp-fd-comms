import { beforeAll, beforeEach, describe, jest, test } from '@jest/globals'

import commsMessage from '../../../mocks/comms-message.js'

jest.unstable_mockModule('../../../../app/repos/notification-log.js', () => ({
  getPendingNotifications: jest.fn(),
  updateNotificationStatus: jest.fn()
}))

jest.unstable_mockModule('../../../../app/jobs/check-notify-status/get-notify-status.js', () => ({
  getNotifyStatus: jest.fn()
}))

jest.unstable_mockModule('../../../../app/messages/outbound/notification-status/publish.js', () => ({
  publishStatus: jest.fn()
}))

jest.unstable_mockModule('../../../../app/messages/outbound/notification-retry/publish.js', () => ({
  publishRetryRequest: jest.fn()
}))

const { getPendingNotifications, updateNotificationStatus } = await import('../../../../app/repos/notification-log.js')
const { getNotifyStatus } = await import('../../../../app/jobs/check-notify-status/get-notify-status.js')
const { publishStatus } = await import('../../../../app/messages/outbound/notification-status/publish.js')
const { publishRetryRequest } = await import('../../../../app/messages/outbound/notification-retry/publish.js')

describe('Check notify status job handler', () => {
  const originalEnv = process.env

  let checkNotifyStatusHandler

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      MESSAGE_RETRY_DELAY: 120000
    }

    const handler = await import('../../../../app/jobs/check-notify-status/handler.js')

    checkNotifyStatusHandler = handler.checkNotifyStatusHandler
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should get notify status for each pending notification', async () => {
    getPendingNotifications.mockReturnValue([
      { id: 1, status: 'sending' },
      { id: 2, status: 'sending' }
    ])

    getNotifyStatus.mockReturnValue({ id: 1, status: 'delivered' })
    getNotifyStatus.mockReturnValue({ id: 2, status: 'delivered' })

    await checkNotifyStatusHandler()

    expect(getNotifyStatus).toHaveBeenCalledTimes(2)
    expect(getNotifyStatus).toHaveBeenCalledWith(1)
    expect(getNotifyStatus).toHaveBeenCalledWith(2)
  })

  test('should log number of updated notifications', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log')

    getPendingNotifications.mockReturnValue([
      { id: 1, message: commsMessage, status: 'sending' },
      { id: 2, message: commsMessage, status: 'sending' },
      { id: 3, message: commsMessage, status: 'sending' }
    ])

    getNotifyStatus.mockReturnValue({ id: 1, status: 'delivered' })

    await checkNotifyStatusHandler()

    expect(consoleLogSpy).toHaveBeenCalledWith('Updated 3 notifications')

    consoleLogSpy.mockRestore()
  })

  test('should update notification status if status has changed', async () => {
    getPendingNotifications.mockReturnValue([
      { id: 1, message: commsMessage, status: 'sending' }
    ])

    getNotifyStatus.mockReturnValue({ id: 1, status: 'delivered' })

    await checkNotifyStatusHandler()

    expect(updateNotificationStatus).toHaveBeenCalledWith(1, 'delivered')
  })

  test('should not update notification status if status has not changed', async () => {
    getPendingNotifications.mockReturnValue([
      { id: 1, message: commsMessage, status: 'sending' }
    ])

    getNotifyStatus.mockReturnValue({ id: 1, status: 'sending' })

    await checkNotifyStatusHandler()

    expect(updateNotificationStatus).not.toHaveBeenCalled()
  })

  test('should not call get notify status if there are no pending notifications', async () => {
    getPendingNotifications.mockReturnValue([])

    await checkNotifyStatusHandler()

    expect(getNotifyStatus).not.toHaveBeenCalled()
  })

  test('should not call update notification status if there are no pending notifications', async () => {
    getPendingNotifications.mockReturnValue([])

    await checkNotifyStatusHandler()

    expect(updateNotificationStatus).not.toHaveBeenCalled()
  })

  test('should log when no pending notifications', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log')

    getPendingNotifications.mockReturnValue([])

    await checkNotifyStatusHandler()

    expect(consoleLogSpy).toHaveBeenCalledWith('No pending notifications')

    consoleLogSpy.mockRestore()
  })

  test('should log error if get notify status fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error')

    getPendingNotifications.mockReturnValue([
      { id: 1, message: commsMessage, status: 'sending' }
    ])

    getNotifyStatus.mockImplementation(() => {
      throw new Error('Request failed with status code 404')
    })

    await checkNotifyStatusHandler()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking notification 1:', 'Request failed with status code 404')

    consoleErrorSpy.mockRestore()
  })

  test.each([
    'delivered',
    'technical-failure',
    'permanent-failure',
    'temporary-failure',
    'internal-failure'
  ])('should call publish event if status has changed to %s', async (newStatus) => {
    getPendingNotifications.mockReturnValue([
      { id: 1, message: commsMessage, recipient: 'mock-email@test.gov.uk', status: 'sending' }
    ])

    getNotifyStatus.mockReturnValue({ id: 1, status: newStatus })

    await checkNotifyStatusHandler()

    expect(publishStatus).toHaveBeenCalledWith(commsMessage, 'mock-email@test.gov.uk', newStatus)
  })

  test('should not publish status if status is sending', async () => {
    getPendingNotifications.mockReturnValue([
      { id: 1, message: commsMessage, status: 'sending' }
    ])

    getNotifyStatus.mockReturnValue({ id: 1, status: 'sending' })

    await checkNotifyStatusHandler()

    expect(publishStatus).not.toHaveBeenCalled()
  })

  describe('technical failure retries', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    test('should schedule retry on technical-failure within retry window', async () => {
      jest.setSystemTime(new Date('2023-01-02T11:00:00Z'))

      const message = {
        ...commsMessage,
        time: '2023-01-01T12:00:00Z'
      }

      getPendingNotifications.mockReturnValue([
        { id: 1, message, recipient: 'mock-email@test.com', status: 'sending' }
      ])

      getNotifyStatus.mockReturnValue({ id: 1, status: 'technical-failure' })

      await checkNotifyStatusHandler()

      expect(publishRetryRequest).toHaveBeenCalledWith(message, 'mock-email@test.com', 120000)
    })

    test('should not schedule retry on technical-failure outside retry window', async () => {
      jest.setSystemTime(new Date('2023-01-02T13:00:00Z'))

      const message = {
        ...commsMessage,
        time: '2023-01-01T12:00:00Z'
      }

      getPendingNotifications.mockReturnValue([
        { id: 1, message, recipient: 'mock-email@test.com', status: 'sending' }
      ])

      getNotifyStatus.mockReturnValue({ id: 1, status: 'technical-failure' })

      await checkNotifyStatusHandler()

      expect(publishRetryRequest).not.toHaveBeenCalled()
    })

    afterAll(() => {
      jest.useRealTimers()
    })
  })

  describe('temporary failure retries', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    test('should schedule retry on temporary-failure within retry window', async () => {
      jest.setSystemTime(new Date('2023-01-02T11:30:00Z'))

      const message = {
        ...commsMessage,
        time: '2023-01-02T11:00:00Z'
      }

      getPendingNotifications.mockReturnValue([
        { id: 1, message, recipient: 'mock-email@test.com', status: 'sending' }
      ])

      getNotifyStatus.mockReturnValue({ id: 1, status: 'temporary-failure' })

      await checkNotifyStatusHandler()

      expect(publishRetryRequest).toHaveBeenCalledWith(message, 'mock-email@test.com', 120000)
    })

    test('should not schedule retry on temporary-failure outside retry window', async () => {
      jest.setSystemTime(new Date('2023-01-02T12:01:00Z'))

      const message = {
        ...commsMessage,
        time: '2023-01-02T11:00:00Z'
      }

      getPendingNotifications.mockReturnValue([
        { id: 1, message, recipient: 'mock-email@test.com', status: 'sending' }
      ])

      getNotifyStatus.mockReturnValue({ id: 1, status: 'temporary-failure' })

      await checkNotifyStatusHandler()

      expect(publishRetryRequest).not.toHaveBeenCalled()
    })
  })

  afterAll(() => {
    jest.useRealTimers()
  })
})
