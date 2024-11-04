import { setup } from './insights.js'
import 'log-timestamp'
import { startMessaging } from './messages/outbound/index.js'

const init = async () => {
  await startMessaging()
  console.log('fcp-fd-comms is ready')
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

setup()
init()
