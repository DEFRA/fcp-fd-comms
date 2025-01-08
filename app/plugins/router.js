import health from '../routes/health.js'
import retrieve from '../routes/retrieve.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([].concat(
        health,
        retrieve
      ))
    }
  }
}

export default router
