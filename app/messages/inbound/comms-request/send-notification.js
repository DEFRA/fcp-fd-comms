import crypto from 'crypto'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

const trySendViaNotify = async (message, emailAddress) => {
  try {
    const { data } = await notifyClient.sendEmail(
      message.data.notifyTemplateId,
      emailAddress, {
        personalisation: message.data.personalisation,
        reference: crypto.randomUUID()
      }
    )

    return [data, null]
  } catch (error) {
    if (!error.response) {
      throw error
    }

    const { data } = error.response

    console.error('Error sending email with code:', data.status_code)

    return [null, data]
  }
}

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [response, error] = await trySendViaNotify(message, emailAddress)

    try {
      if (response) {
        await publishStatus(message, emailAddress, notifyStatus.SENDING)
        await logCreatedNotification(message, emailAddress, response.id)
      } else {
        const status = error.status_code === 500
          ? notifyStatus.TECHNICAL_FAILURE
          : notifyStatus.INTERNAL_FAILURE

        await publishStatus(message, emailAddress, status, error)
        await logRejectedNotification(message, emailAddress, error)
      }
    } catch (error) {
      console.error('Error logging notification: ', error)
    }
  }
}

export { sendNotification }
