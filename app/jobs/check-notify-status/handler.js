import { finishedStatus, retryableStatus } from '../../constants/notify-statuses.js'

import {
  getOriginalNotificationRequest,
  getPendingNotifications,
  updateNotificationStatus
} from '../../repos/notification-log.js'

import { notifyConfig } from '../../config/index.js'
import { getNotifyStatus } from './get-notify-status.js'
import { publishRetryExpiry, publishStatus } from '../../messages/outbound/notification-status/publish.js'
import { checkRetryable } from '../../utils/errors.js'
import { publishRetryRequest } from '../../messages/outbound/notification-retry/publish.js'

const processStatusUpdate = async (notification, status) => {
  const { id, message, createdAt, recipient } = notification

  await updateNotificationStatus(id, status)

  if (finishedStatus.includes(status)) {
    await publishStatus(message, recipient, status)
  }

  if (!retryableStatus.includes(status)) {
    return
  }

  const correlationId = message.data.correlationId

  let intialCreation = new Date(createdAt)

  if (correlationId) {
    const { createdAt } = await getOriginalNotificationRequest(correlationId)

    intialCreation = new Date(createdAt)
  }

  if (checkRetryable(status, intialCreation)) {
    console.log(`Scheduling notification retry for request: ${correlationId || message.id}`)
    await publishRetryRequest(message, recipient, notifyConfig.get('messageRetries.retryDelay'))
  } else {
    console.log(`Retry window expired for request: ${correlationId || message.id}`)
    await publishRetryExpiry(message, recipient)
  }
}

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

      await processStatusUpdate(notification, status)

      updates += 1
    } catch (error) {
      console.error(`Error checking notification ${notification.id}:`, error.message)
    }
  }

  console.log(`Updated ${updates} notifications`)
}

export { checkNotifyStatusHandler }
