import { sendNotification } from './send-notification.js'
import { sendNotificationV2 } from './send-notification-v2.js'

const getVersionHandler = (type) => {
  switch (type) {
    case 'uk.gov.fcp.sfd.notification.request.v2':
    case 'uk.gov.fcp.sfd.notification.request':
      return sendNotificationV2
    case 'uk.gov.fcp.sfd.notification.request.v3':
      return sendNotification
    default:
      throw new Error(`Unsupported message type: ${type}`)
  }
}

const handleMessage = async (message, receiver) => {
  try {
    const versionHandler = getVersionHandler(message.body.type)
    await versionHandler(message.body)
    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleMessage }
