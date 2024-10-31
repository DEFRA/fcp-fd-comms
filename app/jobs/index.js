import { CronJob } from 'cron'

import * as checkNotifyStatus from './check-notify-status/index.js'

const notifyStatusJob = new CronJob(checkNotifyStatus.PATTERN, checkNotifyStatus.handler)

const startJobs = () => {
  notifyStatusJob.start()
}

const stopJobs = () => {
  notifyStatusJob.stop()
}

export { startJobs, stopJobs }
