import { getNotifyStatus } from './get-notify-status.js'
import { getPendingNotifications, updateNotificationStatus } from '../../repos/notification-log.js'
import { publishStatus } from '../../messages/outbound/notification-status/index.js'
import { finishedStatus } from '../../constants/notify-statuses.js'

const checkNotifyStatusHandler = async () => {
  console.log('Checking notify status')

  const pending = await getPendingNotifications()

  if (pending.length === 0) {
    console.log('No pending notifications')
    return
  }

  let updates = 0

  for (const notfication of pending) {
    try {
      const { status } = await getNotifyStatus(notfication.id)

      if (status === notfication.status) {
        continue
      }

      if (finishedStatus.includes(status)) {
        await publishStatus(notfication.message, notification.recipient, status)
      }

      await updateNotificationStatus(notfication.id, status)

      updates += 1
    } catch (error) {
      console.error(`Error checking notification ${notfication.id}:`, error.message)
    }
  }

  console.log(`Updated ${updates} notifications`)
}

export { checkNotifyStatusHandler }
