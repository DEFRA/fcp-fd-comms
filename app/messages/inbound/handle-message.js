import { sendNotification } from './send-notification.js'
import { sendNotificationV2 } from './send-notification-v2.js'

const getVersionHandler = (type) => {
  switch (type) {
    case 'uk.gov.fcp.sfd.notificaiton.request.v2':
      return sendNotificationV2
    default:
      return sendNotification
  }
}

const handleMessage = async (message, receiver) => {
  try {
    const versionHandler = getVersionHandler(message.type)
    await versionHandler(message.body)
    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleMessage }
