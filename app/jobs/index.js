import semaphore from 'semaphore'
import { CronJob } from 'cron'

import { jobsConfig } from '../config/index.js'
import { checkNotifyStatusHandler } from './check-notify-status/index.js'

const statusCheckMutex = semaphore(1)

const notifyStatusJob = new CronJob(
  jobsConfig.get('checkNotifyStatus.cronPattern'),
  async () => {
    if (!statusCheckMutex.available(1)) {
      console.log('Check notify status job already running')
      return
    }

    statusCheckMutex.take(async () => {
      try {
        await checkNotifyStatusHandler()
      } catch (error) {
        console.error('Error running check notify status job:', error.message)
      } finally {
        statusCheckMutex.leave()
      }
    })
  }
)

const startJobs = () => {
  notifyStatusJob.start()
}

const stopJobs = () => {
  notifyStatusJob.stop()
}

export { startJobs, stopJobs }
