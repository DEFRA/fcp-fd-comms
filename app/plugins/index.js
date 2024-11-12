import Blipp from 'blipp'
import logging from './logging.js'
import router from './router.js'
import { serverConfig } from '../config/index.js'

async function registerPlugins (server) {
  const plugins = [
    logging,
    router
  ]

  if (serverConfig.get('isDev')) {
    plugins.push(Blipp)
  }

  await server.register(plugins)
}

export { registerPlugins }
