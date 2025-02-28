import convict from 'convict'

const notify = convict({
  apiKey: {
    doc: 'API key for GOV.UK Notify.',
    format: String,
    default: null,
    env: 'NOTIFY_API_KEY'
  },
  mockApi: {
    endpoint: {
      doc: 'The endpoint for the mock GOV Notify server.',
      format: String,
      default: null,
      nullable: true,
      env: 'MOCK_SERVER_ENDPOINT'
    },
    useMock: {
      doc: 'Use a mock GOV Notify server. (For testing)',
      format: Boolean,
      default: false,
      env: 'USE_MOCK_API_SERVER'
    }
  }
})

notify.validate({ allowed: 'strict' })

export default notify
