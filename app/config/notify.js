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
  },
  apiRetries: {
    maxRetries: {
      doc: 'Maximum number of retries for Notify API calls.',
      format: 'int',
      default: 10,
      env: 'NOTIFY_API_MAX_RETRIES'
    },
    maxDelay: {
      doc: 'Maximum delay between retries for Notify API calls in milliseconds.',
      format: 'int',
      default: 10000,
      env: 'NOTIFY_API_MAX_DELAY'
    },
    startingDelay: {
      doc: 'Starting delay between retries for Notify API calls in milliseconds.',
      format: 'int',
      default: 500,
      env: 'NOTIFY_API_STARTING_DELAY'
    }
  },
  messageRetryDelay: {
    doc: 'Delay to schedule messages for retry in milliseconds.',
    format: 'int',
    default: 30000,
    env: 'MESSAGE_RETRY_DELAY'
  }
})

notify.validate({ allowed: 'strict' })

export default notify
