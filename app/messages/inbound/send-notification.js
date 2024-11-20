import crypto from 'crypto'

import notifyClient from '../../clients/notify-client.js'
import notifyStatus from '../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../repos/notification-log.js'
import { publishStatus } from '../outbound/notification-status/index.js'

const trySendViaNotify = async (message, emailAddress) => {
  try {
    const response = await notifyClient.sendEmail(
      message.data.notifyTemplateId,
      emailAddress, {
        personalisation: message.data.personalisation,
        reference: crypto.randomUUID()
      }
    )

    return [response, null]
  } catch (error) {
    const status = error.response.data.status_code

    console.error('Error sending email with code:', status)

    return [null, error]
  }
}

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [response, notifyError] = await trySendViaNotify(message, emailAddress)

    try {
      if (response) {
        await logCreatedNotification(message, emailAddress, response.data.id)
      } else {
        await publishStatus(message, notifyStatus.INTERNAL_FAILURE, notifyError.response.data)
        await logRejectedNotification(message, emailAddress, notifyError)
      }
    } catch (error) {
      console.error('Error logging notification: ', error)
    }
  }
}

export { sendNotification }
