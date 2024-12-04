import { sendNotification } from './send-notification.js'
import { sendNotificationV2 } from './send-notification-v2.js'

const handleMessage = async (message, receiver) => {
  try {
    if (message.type === 'uk.gov.fcp.sfd.notificaton.request.v2') {
      await sendNotificationV2(message.body)
    } else {
      await sendNotification(message.body)
    }
    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleMessage }
