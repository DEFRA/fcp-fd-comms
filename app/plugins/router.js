import health from '../routes/health.js'

const plugin = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route([].concat(
        health
      ))
    }
  }
}

export default plugin
