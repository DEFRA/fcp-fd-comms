import { findSuccessNotificationByIdAndEmail, findFailNotificationByIdAndEmail } from '../repos/notification-log.js'
import notifyStatus from '../constants/notify-statuses.js'

const checkDuplicateNotification = async (message, emailAddresses) => {
  const emailList = Array.isArray(emailAddresses) ? emailAddresses : [emailAddresses]
  for (const emailAddress of emailList) {
    const existingSuccessNotification = await findSuccessNotificationByIdAndEmail(message.id, emailAddress)
    if (existingSuccessNotification) {
      if (existingSuccessNotification.status === notifyStatus.SENDING ||
        existingSuccessNotification.status === notifyStatus.DELIVERED ||
        existingSuccessNotification.status === notifyStatus.CREATED) {
        const error = new Error('Duplicate notification detected')
        error.response = {
          data: {
            status_code: 409,
            message: `Duplicate notification for ${existingSuccessNotification.id} detected`
          }
        }
        throw error
      }
    } else {
      const existingFailNotification = await findFailNotificationByIdAndEmail(message.id, emailAddress)
      if (existingFailNotification) {
        console.log('resending failed notification')
        return null
      }
    }
  }
}

export { checkDuplicateNotification }
