import { validate } from '../../../schemas/validate.js'
import {
  v3 as commsSchema
} from '../../../schemas/comms-request/index.js'
import { publishInvalidRequest, publishReceived, publishStatus } from '../../outbound/notification-status/publish.js'
import { sendNotification } from './send-notification.js'
import notifyStatus from '../../../constants/notify-statuses.js'

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
        const deliveryCount = message.deliveryCount || 1

        console.log(`Current delivery attempt: ${deliveryCount} of 10`)

        // our logic here and the interaction with service bus needs to be tested and checked more thoroughly
        if (deliveryCount === 8) { // if i change this to > 9 the message will be moved to the dead letter queue by azure service bus by default so need to understand how to handle this better
          console.log('Maximum retry attempts reached')

          try {
            console.log('Publishing technical failure status to data layer...')
            await publishStatus(
              validated,
              validated.data.commsAddresses,
              notifyStatus.TECHNICAL_FAILURE,
              {
                error: 'Maximum retry attempts exceeded',
                deliveryCount,
                messageId: message.messageId
              }
            )
            console.log('Status published successfully')

            console.log('Moving message to dead letter queue...')
            await receiver.deadLetterMessage(message)
            console.log('Message moved to dead letter queue')
          } catch (statusError) {
            console.error('Error during max attempts handling:', statusError)
            throw statusError
          }
          return
        }

        console.log(`Abandoning message for retry. Attempt ${deliveryCount} of 10`)
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
