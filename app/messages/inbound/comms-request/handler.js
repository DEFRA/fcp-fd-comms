import { publishReceived } from '../../outbound/notification-status/publish.js'
import { sendNotification } from './send-notification.js'

const handleCommsRequest = async (message, receiver) => {
  try {
    const commsRequest = message.body
    await publishReceived(commsRequest)
    try {
      await sendNotification(commsRequest, receiver)
      await receiver.completeMessage(message)
    } catch (error) {
      if (error.message === 'NOTIFY_RETRY_ERROR') {
        console.log('Abandoning message for retry due to notify 500 error')
        await receiver.abandonMessage(message)
        return
      }
      throw error
    }
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.deadLetterMessage(message)
  }
}

export { handleCommsRequest }
