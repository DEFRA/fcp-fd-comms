import semaphore from 'semaphore'
import { CronJob } from 'cron'

import { jobsConfig } from '../config/index.js'
import { checkNotifyStatusHandler } from './check-notify-status/index.js'
import { retryTechnicalFailuresHandler } from './retry-technical-failures/handler.js'

const statusCheckMutex = semaphore(1)
const retryTechFailuresMutex = semaphore(1)

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

const retryTechFailuresJob = new CronJob(
  jobsConfig.get('retryTechFailures.cronPattern'),
  async () => {
    if (!retryTechFailuresMutex.available(1)) {
      console.log('Retry technical failures job already running')
      return
    }

    retryTechFailuresMutex.take(async () => {
      try {
        await retryTechnicalFailuresHandler()
      } catch (error) {
        console.error('Error running retry technical failures job:', error.message)
      } finally {
        retryTechFailuresMutex.leave()
      }
    })
  }
)

const startJobs = () => {
  notifyStatusJob.start()
  retryTechFailuresJob.start()
}

const stopJobs = () => {
  notifyStatusJob.stop()
  retryTechFailuresJob.stop()
}

export { startJobs, stopJobs }
