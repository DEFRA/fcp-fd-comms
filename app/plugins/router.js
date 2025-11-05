import health from '../routes/health.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health].flat())
    }
  }
}

export default router
