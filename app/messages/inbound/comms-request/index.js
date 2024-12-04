import { validate } from '../../../schemas/validate.js'
import {
  v3 as commsSchema
} from '../../../schemas/comms-request/index.js'
import { publishInvalidRequest, publishReceived } from '../../outbound/notification-status/index.js'
import { sendNotification } from './send-notification.js'

const handleCommsRequest = async (message, receiver) => {
  try {
    const [validated, error] = await validate(commsSchema, message.body)

    if (error) {
      console.error('Error validating message: ', error)

      await publishInvalidRequest(message.body, error)

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
