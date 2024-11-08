import health from '../routes/health.js'
import notifyCallback from '../routes/notify-callback.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([].concat(
        health,
        notifyCallback
      ))
    }
  }
}

export default router
