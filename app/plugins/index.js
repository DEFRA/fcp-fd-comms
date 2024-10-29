import Blipp from 'blipp'
import logging from './logging.js'
import router from './router.js'
import config from '../config.js'

async function registerPlugins (server) {
  const plugins = [
    logging,
    router
  ]

  if (config.get('isDev')) {
    plugins.push(Blipp)
  }

  await server.register(plugins)
}

export { registerPlugins }
