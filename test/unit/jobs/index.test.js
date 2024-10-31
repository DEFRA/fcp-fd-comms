import { beforeEach, expect, jest } from '@jest/globals'

import { checkNotifyStatusHandler } from '../../../app/jobs/check-notify-status'

const mockStartJob = jest.fn()
const mockStopJob = jest.fn()

const mockCronJob = jest.fn().mockImplementation(() => ({
  start: mockStartJob,
  stop: mockStopJob
}))

jest.unstable_mockModule('cron', () => ({
  CronJob: mockCronJob
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
    expect(mockCronJob).toHaveBeenCalledWith('*/30 * * * * *', checkNotifyStatusHandler)
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
