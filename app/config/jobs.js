import convict from 'convict'

const jobs = convict({
  checkNotifyStatus: {
    cronPattern: {
      doc: 'Cron expression for checking notify status.',
      format: String,
      default: '*/30 * * * * *',
      env: 'CHECK_NOTIFY_STATUS_CRON_PATTERN'
    }
  },
  retryTechFailures: {
    cronPattern: {
      doc: 'Cron expression for retrying technical failures.',
      format: String,
      default: '*/30 * * * * *',
      env: 'RETRY_TECH_FAILURES_CRON_PATTERN'
    }
  }
})

export default jobs
