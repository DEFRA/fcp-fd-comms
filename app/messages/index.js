import { MessageReceiver } from 'ffc-messaging'
import { handleMessage } from './handle-message.js'
import { messageConfig } from '../config/index.js'

const startMessaging = async () => {
  let commsReceiver // eslint-disable-line
  const receiverAction = (message) => handleMessage(message, commsReceiver)

  const config = {
    ...messageConfig.get('messageQueue'),
    ...messageConfig.get('receiverSubscription')
  }

  commsReceiver = new MessageReceiver(
    config,
    receiverAction
  )

  await commsReceiver.subscribe()
  console.info('Service is ready to consume messages')
}

export { startMessaging }
