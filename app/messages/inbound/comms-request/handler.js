import { publishReceived } from '../../outbound/notification-status/publish.js'
import { sendNotification } from './send-notification.js'
import { notifyStatus } from '../../../constants/notify-statuses.js'

const handleCommsRequest = async (message, receiver) => {
  try {
    const commsRequest = message.body
    await publishReceived(commsRequest)
    await sendNotification(commsRequest, receiver)
    await receiver.completeMessage(message)
  } catch (error) {
    if (error.cause === notifyStatus.TECHNICAL_FAILURE) {
      console.log('Abandoning message for retry due to notify 500 error')
      await receiver.abandonMessage(message)
      return
    }
    console.error('Error handling message: ', error)
    await receiver.deadLetterMessage(message)
  }
}

export { handleCommsRequest }
