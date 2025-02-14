import { validate } from '../../../schemas/validate.js'
import {
  v3 as commsSchema
} from '../../../schemas/comms-request/index.js'
import { publishInvalidRequest, publishReceived } from '../../outbound/notification-status/publish.js'
import { sendNotification } from './send-notification.js'

const handleCommsRequest = async (message, receiver) => {
  const commsRequest = message.body

  try {
    const [validated, errors] = await validate(commsSchema, commsRequest)

    if (errors) {
      console.error('Invalid comms request received. Request ID:', commsRequest.id)

      if (commsRequest.id) {
        await publishInvalidRequest(commsRequest, errors)
      } else {
        console.error('No ID provided in message. Cannot publish invalid request to data layer.')
      }

      await receiver.deadLetterMessage(message)
      return
    }

    await publishReceived(validated)

    try {
      await sendNotification(validated, receiver)
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
    await receiver.abandonMessage(message)
  }
}

export { handleCommsRequest }
