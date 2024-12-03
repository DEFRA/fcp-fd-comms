import { publishReceived } from '../../outbound/notification-status/index.js'
import { validate } from './validate-request.js'
import { sendNotification } from './send-notification.js'

const handleCommsRequest = async (message, receiver) => {
  try {
    const [validated, error] = await validate(message.body)

    if (error) {
      console.error('Error validating message: ', error)

      await receiver.deadLetterMessage(message)

      return
    }

    await publishReceived(validated)
    await sendNotification(validated)

    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleCommsRequest }
