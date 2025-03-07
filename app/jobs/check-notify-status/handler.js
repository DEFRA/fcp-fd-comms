import { getNotifyStatus } from './get-notify-status.js'
import { getPendingNotifications, updateNotificationStatus } from '../../repos/notification-log.js'
import { publishStatus } from '../../messages/outbound/notification-status/publish.js'
import { finishedStatus, retryableStatus } from '../../constants/notify-statuses.js'
import { publishRetryRequest } from '../../messages/outbound/notification-retry/publish.js'
import { notifyConfig } from '../../config/index.js'
import { shouldRetryMessage } from '../../utils/errors.js'

const checkNotifyStatusHandler = async () => {
  console.log('Checking notify status')

  const pending = await getPendingNotifications()

  if (pending.length === 0) {
    console.log('No pending notifications')
    return
  }

  let updates = 0

  for (const notification of pending) {
    try {
      const { status } = await getNotifyStatus(notification.id)

      if (status === notification.status) {
        continue
      }

      if (finishedStatus.includes(status)) {
        await publishStatus(notification.message, notification.recipient, status)
      }

      await updateNotificationStatus(notification.id, status)

      const intialCreation = new Date(notification.message.time)

      if (retryableStatus.includes(status) && shouldRetryMessage(intialCreation, status)) {
        console.log(`Scheduling notification retry for message: ${notification.message.id}`)
        await publishRetryRequest(notification.message, notification.recipient, notifyConfig.get('messageRetries.retryDelay'))
      }

      updates += 1
    } catch (error) {
      console.error(`Error checking notification ${notification.id}:`, error.message)
    }
  }

  console.log(`Updated ${updates} notifications`)
}

export { checkNotifyStatusHandler }
