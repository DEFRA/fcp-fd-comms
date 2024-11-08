import health from '../routes/health.js'
import notifyCallback from '../routes/notify-callback.js'

const plugin = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route([].concat(
        health,
        notifyCallback
      ))
    }
  }
}

export default plugin
