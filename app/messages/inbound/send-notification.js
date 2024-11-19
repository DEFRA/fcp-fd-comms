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

    return [true, response]
  } catch (error) {
    console.error('Error sending email: ', error)

    return [false, error]
  }
}

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [success, result] = await trySendViaNotify(message, emailAddress)

    const status = success
      ? notifyStatus.CREATED
      : notifyStatus.INTERNAL_FAILURE

    try {
      if (success) {
        await publishStatus(message, emailAddress, status)
        await logCreatedNotification(message, emailAddress, result.data.id)
      } else {
        await publishStatus(message, emailAddress, status, result.response)
        await logRejectedNotification(message, emailAddress, result)
      }
    } catch (error) {
      console.error('Error logging notification: ', error)
    }
  }
}

export { sendNotification }
