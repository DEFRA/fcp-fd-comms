import 'log-timestamp'

import { setup } from './insights.js'
import { startMessaging } from './messages/index.js'
import { startJobs } from './jobs/index.js'

const init = async () => {
  await startMessaging()
  startJobs()

  console.log('fcp-fd-comms is ready')
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

setup()
init()
