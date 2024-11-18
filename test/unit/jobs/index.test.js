import { beforeEach, expect, jest } from '@jest/globals'
const mockStartJob = jest.fn()
const mockStopJob = jest.fn()

const mockCheckNotifyStatusHandler = jest.fn()

const mockCronJob = jest.fn().mockImplementation(() => ({
  start: mockStartJob,
  stop: mockStopJob
}))

jest.unstable_mockModule('cron', () => ({
  CronJob: mockCronJob
}))

jest.unstable_mockModule('../../../app/jobs/check-notify-status', () => ({
  checkNotifyStatusHandler: mockCheckNotifyStatusHandler
}))

describe('Cron job setup', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    delete process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN
  })

  test('check notify status cron job should be created', async () => {
    process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    expect(mockCronJob).toHaveBeenCalledTimes(1)
    expect(mockCronJob).toHaveBeenCalledWith('*/30 * * * * *', mockCheckNotifyStatusHandler)
  })

  test('start jobs should start jobs', async () => {
    const { startJobs } = await import('../../../app/jobs/index.js')

    startJobs()

    expect(mockStartJob).toHaveBeenCalledTimes(1)
  })

  test('stop jobs should stop jobs', async () => {
    const { stopJobs } = await import('../../../app/jobs/index.js')

    stopJobs()

    expect(mockStopJob).toHaveBeenCalledTimes(1)
  })
})
