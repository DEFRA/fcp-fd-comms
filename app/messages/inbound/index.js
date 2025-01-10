import { MessageReceiver } from 'ffc-messaging'
import { messageConfig } from '../../config/index.js'
import { handleCommsRequest } from './comms-request/handler.js'

const startMessaging = async () => {
  const config = {
    ...messageConfig.get('messageQueue'),
    ...messageConfig.get('receiverSubscription')
  }

  const commsReceiver = new MessageReceiver(
    config,
    (message) => handleCommsRequest(message, commsReceiver)
  )

  await commsReceiver.subscribe()
  console.log('fcp-fd-comms is ready to consume messages')
}

export { startMessaging }
