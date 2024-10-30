import { MessageReceiver } from 'ffc-messaging'
import { handleMessage } from './handle-message.js'
import config from '../config/index.js'

const startMessaging = async () => {
  const messageConfig = {
    ...config.get('messaging.sharedConfig'),
    ...config.get('messaging.receiverSubscription')
  }

  console.log('Starting messaging service with config:', messageConfig)

  const commsReceiver = new MessageReceiver(
    messageConfig,
    (message) => handleMessage(message, commsReceiver)
  )

  await commsReceiver.subscribe()
  console.info('Service is ready to consume messages')
}

export { startMessaging }
