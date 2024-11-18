import { sendNotification } from './send-notification.js'

const handleMessage = async (message, receiver) => {
  try {
    await sendNotification(message.body)
    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleMessage }
