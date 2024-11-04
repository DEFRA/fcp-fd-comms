import { MessageReceiver } from 'ffc-messaging'
import { handleMessage } from './handle-message.js'
import { messageConfig } from '../../config/index.js'

const startMessaging = async () => {
  const config = {
    ...messageConfig.get('messageQueue'),
    ...messageConfig.get('receiverSubscription')
  }

  const commsReceiver = new MessageReceiver(
    config,
    (message) => handleMessage(message, commsReceiver)
  )

  await commsReceiver.subscribe()
  console.info('Service is ready to consume messages')
}

export { startMessaging }
