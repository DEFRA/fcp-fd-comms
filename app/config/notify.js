import convict from 'convict'

const notify = convict({
  apiKey: {
    doc: 'API key for GOV.UK Notify.',
    format: String,
    default: null,
    env: 'NOTIFY_API_KEY'
  }
})

export default notify