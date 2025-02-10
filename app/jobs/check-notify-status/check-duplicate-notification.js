import { findNotificationByIdAndEmail } from '../../repos/notification-log.js'

const checkDuplicateNotification = async (message, emailAddress) => {
  const existingNotification = await findNotificationByIdAndEmail(message.id, emailAddress)
  if (['sending', 'delivered', 'created'].includes(existingNotification?.status)) {
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
