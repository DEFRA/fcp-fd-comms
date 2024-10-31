import { getPendingNotifications, updateNotificationStatus } from '../../repos/notfication-log.js'
import { getNotifyStatus } from './get-notify-status.js'

const checkNotifyStatusHandler = async () => {
  console.log('Checking notify status')

  const pending = getPendingNotifications()

  if (pending.length === 0) {
    console.log('No pending notifications')
    return
  }

  let updates = 0

  for (const notfication of pending) {
    try {
      const { status } = await getNotifyStatus(notfication.id)

      if (status !== notfication.status) {
        updateNotificationStatus(notfication, status)

        updates += 1
      }
    } catch (error) {
      console.error(`Error checking notification ${notfication.id}:`, error.message)
    }
  }

  console.log(`Updated ${updates} notifications`)
}

export { checkNotifyStatusHandler }
