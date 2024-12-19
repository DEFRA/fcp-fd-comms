import { validate } from '../../../schemas/validate.js'
import {
  v3 as commsSchema
} from '../../../schemas/comms-request/index.js'
import { publishInvalidRequest, publishReceived } from '../../outbound/notification-status/publish.js'
import { sendNotification } from './send-notification.js'
import parseObject from '../../../utils/parse-object.js'

const handleCommsRequest = async (message, receiver) => {
  try {
    const commsRequest = parseObject(message.body)

    if (!commsRequest) {
      console.error('Invalid JSON message body received.')

      await receiver.deadLetterMessage(message)

      return
    }

    const [validated, errors] = await validate(commsSchema, commsRequest)

    if (errors) {
      console.error('Invalid comms request received. Request ID:', commsRequest.id)

      await publishInvalidRequest(commsRequest, errors)

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
