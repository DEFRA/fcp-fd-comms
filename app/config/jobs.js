import convict from 'convict'

const jobs = convict({
  checkNotifyStatus: {
    cronPattern: {
      doc: 'Cron expression for checking notify status.',
      format: String,
      default: '*/30 * * * * *'
    }
  }
})

export default jobs
