import { beforeEach, expect, jest, test } from '@jest/globals'

const mockStartJob = jest.fn()
const mockStopJob = jest.fn()

const mockCronJob = jest.fn().mockImplementation(() => ({
  start: mockStartJob,
  stop: mockStopJob
}))

jest.unstable_mockModule('cron', () => ({
  CronJob: mockCronJob
}))

const availableMock = jest.fn()
const takeMock = jest.fn().mockImplementation((fn) => fn())
const leaveMock = jest.fn()

jest.unstable_mockModule('semaphore', () => ({
  default: jest.fn(() => ({
    available: availableMock,
    take: takeMock,
    leave: leaveMock
  }))
}))

const mockCheckNotifyStatusHandler = jest.fn()
const mockRetryTechnicalFailuresHandler = jest.fn()

jest.unstable_mockModule('../../../app/jobs/check-notify-status/index.js', () => ({
  checkNotifyStatusHandler: mockCheckNotifyStatusHandler
}))

jest.unstable_mockModule('../../../app/jobs/retry-technical-failures/handler.js', () => ({
  retryTechnicalFailuresHandler: mockRetryTechnicalFailuresHandler
}))

describe('Cron job setup', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    delete process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN
    delete process.env.RETRY_TECHNICAL_FAILURES_CRON_PATTERN
  })

  test('check notify status cron job should be created', async () => {
    availableMock.mockReturnValue(true)

    process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    expect(mockCronJob).toHaveBeenCalledWith('*/30 * * * * *', expect.any(Function))
  })

  test('retry technical failures cron job should be created', async () => {
    availableMock.mockReturnValue(true)

    process.env.RETRY_TECHNICAL_FAILURES_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    expect(mockCronJob).toHaveBeenCalledWith('*/30 * * * * *', expect.any(Function))
  })

  test('start jobs should start jobs', async () => {
    const { startJobs } = await import('../../../app/jobs/index.js')

    startJobs()

    expect(mockStartJob).toHaveBeenCalledTimes(2)
  })

  test('stop jobs should stop jobs', async () => {
    const { stopJobs } = await import('../../../app/jobs/index.js')

    stopJobs()

    expect(mockStopJob).toHaveBeenCalledTimes(2)
  })

  test('mutex should allow check notify status job to run', async () => {
    availableMock.mockReturnValue(true)

    process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[0][1]()

    expect(mockCheckNotifyStatusHandler).toHaveBeenCalledTimes(1)
  })

  test('mutex should prevent concurrent check notify status jobs', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log')

    availableMock.mockReturnValue(false)

    process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[0][1]()

    expect(consoleLogSpy).toHaveBeenCalledWith('Check notify status job already running')
    expect(mockCheckNotifyStatusHandler).not.toHaveBeenCalled()

    consoleLogSpy.mockRestore()
  })

  test('mutex should release after check notify status job completes', async () => {
    availableMock.mockReturnValue(true)

    process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[0][1]()

    expect(leaveMock).toHaveBeenCalledTimes(1)
  })

  test('cron handler should catch and log errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error')

    availableMock.mockReturnValue(true)
    mockCheckNotifyStatusHandler.mockRejectedValue(new Error('Error connecting to database'))

    process.env.CHECK_NOTIFY_STATUS_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[0][1]()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error running check notify status job:', 'Error connecting to database')

    consoleErrorSpy.mockRestore()
  })

  test('mutex should allow retry technical failures job to run', async () => {
    availableMock.mockReturnValue(true)

    process.env.RETRY_TECHNICAL_FAILURES_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[1][1]()

    expect(mockRetryTechnicalFailuresHandler).toHaveBeenCalledTimes(1)
  })

  test('mutex should prevent concurrent retry technical failures jobs', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log')

    availableMock.mockReturnValue(false)

    process.env.RETRY_TECHNICAL_FAILURES_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[1][1]()

    expect(consoleLogSpy).toHaveBeenCalledWith('Retry technical failures job already running')
    expect(mockRetryTechnicalFailuresHandler).not.toHaveBeenCalled()

    consoleLogSpy.mockRestore()
  })

  test('mutex should release after retry technical failures job completes', async () => {
    availableMock.mockReturnValue(true)

    process.env.RETRY_TECHNICAL_FAILURES_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[1][1]()

    expect(leaveMock).toHaveBeenCalledTimes(1)
  })

  test('cron handler should catch and log errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error')

    availableMock.mockReturnValue(true)
    mockRetryTechnicalFailuresHandler.mockRejectedValue(new Error('Error connecting to database'))

    process.env.RETRY_TECHNICAL_FAILURES_CRON_PATTERN = '*/30 * * * * *'

    await import('../../../app/jobs/index.js')

    await mockCronJob.mock.calls[1][1]()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error running retry technical failures job:', 'Error connecting to database')

    consoleErrorSpy.mockRestore()
  })
})
