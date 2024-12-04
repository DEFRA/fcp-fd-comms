import { sendNotification } from './send-notification.js'
import { sendNotificationV2 } from './send-notification-v2.js'

const getVersionHandler = (type) => {
  switch (type) {
    case 'uk.gov.fcp.sfd.notification.request.v2':
      return sendNotificationV2
    case 'uk.gov.fcp.sfd.notification.request.v3':
    case 'uk.gov.fcp.sfd.notification.request':
      return sendNotification
    default:
      throw new Error(`Unsupported message type: ${type}`)
  }
}

export { getVersionHandler }
