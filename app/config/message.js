import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'
import environments from '../constants/environments.js'

convict.addFormats(convictFormatWithValidator)

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['development', 'test', 'production'],
    default: 'development',
    env: 'NODE_ENV'
  },
  host: {
    doc: 'The message queue host.',
    format: String,
    default: '',
    env: 'MESSAGE_HOST'
  },
  username: {
    doc: 'The message queue username.',
    format: String,
    default: '',
    env: 'MESSAGE_USER'
  },
  password: {
    doc: 'The message queue password.',
    format: String,
    default: '',
    env: 'MESSAGE_PASSWORD'
  },
  useCredentialChain: {
    doc: 'Use the Azure Credential Chain.',
    format: Boolean,
    default: false
  },
  managedIdentityClientId: {
    doc: 'The Client ID associated with the Managed Identity.',
    format: String,
    default: '',
    env: 'COMMS_AZURE_CLIENT_ID'
  },
  appInsights: {
    doc: 'The Application Insights instance.',
    format: Object,
    default: null,
    nullable: true
  },
  receiverSubscription: {
    doc: 'Configuration for message receiver subscription.',
    format: Object,
    default: {
      address: '',
      topic: '',
      type: 'subscription'
    },
    properties: {
      address: {
        doc: 'The message queue address (subscription).',
        format: String,
        default: '',
        env: 'MESSAGES_SUBSCRIPTION_ADDRESS'
      },
      topic: {
        doc: 'The message queue topic.',
        format: String,
        default: '',
        env: 'MESSAGES_TOPIC_ADDRESS'
      },
      type: {
        doc: 'The message queue type.',
        format: String,
        default: 'subscription'
      }
    }
  }
})

if (config.get('env') === environments.PRODUCTION) {
  config.set('useCredentialChain', true)

  const appInsights = await import('applicationinsights')
  config.set('appInsights', appInsights)
}

config.validate({ allowed: 'strict' })

export default config
