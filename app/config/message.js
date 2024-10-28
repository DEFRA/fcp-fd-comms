import convict from 'convict'
import environments from '../constants/environments.js'

const config = convict({
  messageQueue: {
    host: {
      doc: 'Message queue host URL',
      format: 'url',
      default: null,
      env: 'MESSAGE_HOST'
    },
    username: {
      doc: 'Message queue username',
      format: String,
      default: null,
      env: 'MESSAGE_USER'
    },
    password: {
      doc: 'Message queue password',
      format: String,
      default: null,
      env: 'MESSAGE_PASSWORD',
      sensitive: true
    },
    useCredentialChain: {
      doc: 'Use credential chain for authentication',
      format: Boolean,
      default: false,
      env: 'USE_CREDENTIAL_CHAIN'
    },
    managedIdentityClientId: {
      doc: 'Managed identity client ID',
      format: String,
      default: null,
      env: 'COMMS_AZURE_CLIENT_ID',
      nullable: true
    },
    appInsights: {
      doc: 'App Insights client instance',
      format: '*',
      default: process.env.NODE_ENV === environments.PRODUCTION ? await import('applicationinsights') : undefined
    }
  },
  receiverSubscription: {
    address: {
      doc: 'Receiver subscription address',
      format: String,
      default: null,
      env: 'MESSAGES_SUBSCRIPTION_ADDRESS'
    },
    topic: {
      doc: 'Topic for the subscription',
      format: String,
      default: null,
      env: 'MESSAGES_TOPIC_ADDRESS'
    },
    type: {
      doc: 'Type of subscription',
      format: String,
      default: 'subscription'
    }
  }
})

config.validate({ allowed: 'strict' })

export default config
