import { findNotificationByIdAndEmail } from '../../repos/notification-log.js'
import { getNotifyStatus } from './../../jobs/check-notify-status/get-notify-status.js'

const checkDuplicateNotification = async (message, emailAddress) => {
  const existingNotification = await findNotificationByIdAndEmail(message.id, emailAddress)
  if (!existingNotification) {
    return null
  }
  const notifyStatusResponse = await getNotifyStatus(existingNotification.notifyResponseId)
  if (['sending', 'delivered', 'created'].includes(notifyStatusResponse?.status)) {
    return {
      response: {
        data: {
          status_code: 409
        }
      }
    }
  }
  return null
}

export { checkDuplicateNotification }
