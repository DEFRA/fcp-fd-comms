import notifyStatus from '../../../constants/notify-statuses.js'
import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'
import { buildPersonalisation } from './build-personalisation.js'
import { trySendViaNotify } from './try-send-via-notify.js'

const sendNotification = async (message) => {
  const personalisation = await buildPersonalisation(message)

  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [response, notifyError] = await trySendViaNotify(message, emailAddress, personalisation)

    try {
      if (response) {
        await publishStatus(message, emailAddress, notifyStatus.SENDING)
        await logCreatedNotification(message, emailAddress, response.data.id)
      } else {
        const status = notifyStatus.INTERNAL_FAILURE
        const notifyErrorData = notifyError.response.data

        await publishStatus(message, emailAddress, status, notifyErrorData)
        await logRejectedNotification(message, emailAddress, notifyError)
      }
    } catch (error) {
      console.error('Error logging notification: ', error)
    }
  }
}

export { sendNotification }
