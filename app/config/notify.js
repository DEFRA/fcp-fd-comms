import convict from 'convict'

const notify = convict({
  notifyApiKey: {
    doc: 'API key for GOV.UK Notify',
    format: String,
    default: null,
    env: 'NOTIFY_API_KEY'
  }
})

notify.validate({ allowed: 'strict' })

export default notify
