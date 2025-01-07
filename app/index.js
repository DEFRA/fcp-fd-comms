import 'log-timestamp'

import { setup } from './insights.js'
import { createServer } from './server.js'
import { startMessaging } from './messages/inbound/start-messaging.js'
import { startJobs } from './jobs/index.js'
import { retrieve } from './files/retrieve.js'

const init = async () => {
  const server = await createServer()
  await server.start()
  await startMessaging()
  startJobs()

  await retrieve()

  console.log('fcp-fd-comms is ready')
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

setup()
init()
