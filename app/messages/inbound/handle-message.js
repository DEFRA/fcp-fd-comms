import { publishReceived } from '../outbound/notification-status/index.js'
import { sendNotification } from './send-notification.js'

const handleMessage = async (message, receiver) => {
  try {
    const messageBody = message.body

    await publishReceived(messageBody)
    await sendNotification(messageBody)
    
    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleMessage }
