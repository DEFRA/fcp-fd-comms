import { MessageReceiver } from 'ffc-messaging'
import { messageConfig } from '../config/index.js'
import { handleMessage } from './handle-message.js'

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
  console.log('fcp-fd-comms is ready to consume messages')
}

export { startMessaging }
