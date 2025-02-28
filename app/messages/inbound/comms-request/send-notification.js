import crypto from 'crypto'
import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'
import { logCreatedNotification, logRejectedNotification, checkDuplicateNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

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
    const statusCode = error.response?.data?.status_code
    console.error('Error sending email with code:', statusCode)
    return [null, error]
  }
}

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const duplicate = await checkDuplicateNotification(message.id, emailAddress)

    if (duplicate) {
      console.warn('Duplicate notification detected')
      continue
    }

    const [response, notifyError] = await trySendViaNotify(message, emailAddress)

    try {
      if (response) {
        await publishStatus(message, emailAddress, notifyStatus.SENDING)
        await logCreatedNotification(message, emailAddress, response.data.id)
      } else {
        const status = notifyError.response.status_code === 500
          ? notifyStatus.TECHNICAL_FAILURE
          : notifyStatus.INTERNAL_FAILURE

        const notifyErrorData = notifyError.response.data
        await publishStatus(message, emailAddress, status, notifyErrorData)
        await logRejectedNotification(message, emailAddress, notifyError)
      }
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }
}

export { sendNotification }
