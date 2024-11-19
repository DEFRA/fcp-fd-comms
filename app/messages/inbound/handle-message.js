import util from 'util'
import { sendNotification } from './send-notification.js'

const handleMessage = async (message, receiver) => {
  try {
    await sendNotification(message)
    await receiver.completeMessage(message)
  } catch (error) {
    throw new Error('Message error', util.inspect(error.message, false, null, true))
  }
}

export { handleMessage }
