import Joi from 'joi'
import environments from '../constants/environments.js'

const schema = Joi.object({
  messageQueue: {
    host: Joi.string(),
    username: Joi.string(),
    password: Joi.string(),
    useCredentialChain: Joi.bool().default(false),
    managedIdentityClientId: Joi.string().optional(),
    appInsights: Joi.object()
  },
  receiverSubscription: {
    address: Joi.string(),
    topic: Joi.string(),
    type: Joi.string().allow('subscription')
  }
})

const config = {
  messageQueue: {
    host: process.env.MESSAGE_HOST,
    username: process.env.MESSAGE_USER,
    password: process.env.MESSAGE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === environments.PRODUCTION,
    managedIdentityClientId: process.env.COMMS_AZURE_CLIENT_ID,
    appInsights:
      process.env.NODE_ENV === environments.PRODUCTION
        ? await import('applicationinsights')
        : undefined
  },
  receiverSubscription: {
    address: process.env.MESSAGES_SUBSCRIPTION_ADDRESS,
    topic: process.env.MESSAGES_TOPIC_ADDRESS,
    type: 'subscription'
  }
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The message config is invalid. ${result.error.message}`)
}

const receiverSubscription = {
  ...result.value.messageQueue,
  ...result.value.receiverSubscription
}

export default receiverSubscription
