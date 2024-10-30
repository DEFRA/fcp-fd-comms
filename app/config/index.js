import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'

import environments from '../constants/environments.js'
import messaging from './messaging.js'

convict.addFormats(convictFormatWithValidator)

const config = convict({
  messaging,
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: environments.DEVELOPMENT,
    env: 'NODE_ENV'
  },
  isDev: {
    doc: 'True if the application is in development mode.',
    format: Boolean,
    default: process.env.NODE_ENV === environments.DEVELOPMENT
  },
  host: {
    doc: 'The host to bind.',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3039,
    env: 'PORT',
    arg: 'port'
  }
})

config.validate({ allowed: 'strict' })

export default config
