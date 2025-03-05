import { checkDuplicateNotification } from '../../../repos/notification-log.js'
import { publishReceived } from '../../outbound/notification-status/publish.js'
import { sendNotification } from './send-notification.js'

const handleCommsRequest = async (message, receiver) => {
  try {
    const commsRequest = message.body

    const duplicate = await checkDuplicateNotification(commsRequest?.id)

    if (duplicate) {
      console.warn(`Duplicate notification request received with id: ${commsRequest?.id}`)
      return await receiver.completeMessage(message)
    }

    await publishReceived(commsRequest)
    await sendNotification(commsRequest)

    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.deadLetterMessage(message)
  }
}

export { handleCommsRequest }
