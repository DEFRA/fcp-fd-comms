import { sendNotification } from './send-notification.js'

const handleCommsRequest = async (message, receiver) => {
  const commsRequest = message.body

  try {
    await publishReceived(commsRequest)
    await sendNotification(commsRequest)

    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleCommsRequest }
