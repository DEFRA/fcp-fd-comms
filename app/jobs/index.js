import { CronJob } from 'cron'

import { jobsConfig } from '../config/index.js'
import { checkNotifyStatusHandler } from './check-notify-status/index.js'

const notifyStatusJob = new CronJob(
  jobsConfig.get('checkNotifyStatus.cronPattern'),
  checkNotifyStatusHandler
)

const startJobs = () => {
  notifyStatusJob.start()
}

const stopJobs = () => {
  notifyStatusJob.stop()
}

export { startJobs, stopJobs }
