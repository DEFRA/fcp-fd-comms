import Hapi from '@hapi/hapi'
import Joi from 'joi'
import { registerPlugins } from './plugins/index.js'
import { serverConfig } from './config/index.js'

async function createServer () {
  const server = Hapi.server({
    host: serverConfig.get('host'),
    port: serverConfig.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  server.validator(Joi)
  await registerPlugins(server)

  return server
}

export { createServer }
