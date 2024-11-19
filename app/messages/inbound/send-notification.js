import crypto from 'crypto'

import notifyClient from '../../clients/notify-client.js'
import { logCreatedNotification, logRejectedNotification } from '../../repos/notification-log.js'

const trySendViaNotify = async (message, emailAddress) => {
  try {
    const response = await notifyClient.sendEmail(
      message.body.data.notifyTemplateId,
      emailAddress, {
        personalisation: message.body.data.personalisation,
        reference: crypto.randomUUID()
      }
    )

    return [true, response]
  } catch (error) {
    console.error('Error sending email: ', error)

    return [false, error]
  }
}

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.body.data.commsAddress)
    ? message.body.data.commsAddress
    : [message.body.data.commsAddress]

  for (const emailAddress of emailAddresses) {
    const [success, response] = await trySendViaNotify(message, emailAddress)

    try {
      if (success) {
        await logCreatedNotification(message, response.data.id)
      } else {
        await logRejectedNotification(message, response)
      }
    } catch (error) {
      console.error('Error logging notification: ', error)
    }
  }
}

export { sendNotification }
