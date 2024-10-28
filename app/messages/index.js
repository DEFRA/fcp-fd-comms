import util from 'util'
import { messageConfig } from '../config/index.js'
import { MessageReceiver } from 'ffc-messaging'
import { sendNotification } from './send-notification.js'

const handleMessage = async (message, receiver) => {
  try {
    await sendNotification(message)
    await receiver.completeMessage(message)
  } catch (error) {
    throw new Error('Message error', util.inspect(error.message, false, null, true))
  }
}

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
  console.info('fcp-fd-comms is ready to consume messages')
}

export { startMessaging }
