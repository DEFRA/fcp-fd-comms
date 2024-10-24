import { setup } from './insights.js'
import 'log-timestamp'
import { createServer } from './server.js'
import { startMessaging } from './messages/index.js'

const init = async () => {
  const server = await createServer()
  await server.start()
  await startMessaging()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

setup()
init()
