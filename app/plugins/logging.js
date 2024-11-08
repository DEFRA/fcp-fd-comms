import HapiPino from 'hapi-pino'

const plugin = {
  plugin: HapiPino,
  options: {
    logPayload: true,
    level: 'warn'
  }
}

export default plugin
