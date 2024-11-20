import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'

const logCreatedNotification = async (message, recipient, notificationId) => {
  await db.notifyApiRequestSuccess.create({
    createdAt: new Date(),
    notifyResponseId: notificationId,
    message,
    status: notifyStatus.CREATED,
    statusUpdatedAt: new Date(),
    completed: null,
    recipient
  })
}

const logRejectedNotification = async (message, recipient, notifyError) => {
  await db.notifyApiRequestFailure.create({
    createdAt: new Date(),
    message,
    error: notifyError.response.data,
    recipient
  })
}

const getPendingNotifications = async () => {
  const pending = await db.notifyApiRequestSuccess.findAll({
    where: {
      completed: null
    }
  })

  return pending.map((notification) => ({
    id: notification.notifyResponseId,
    status: notification.status,
    message: notification.message
  }))
}

const updateNotificationStatus = async (notificationId, status) => {
  const notification = await db.notifyApiRequestSuccess.findOne({
    where: {
      notifyResponseId: notificationId
    }
  })

  notification.status = status
  notification.statusUpdatedAt = new Date()

  if (status !== notifyStatus.CREATED && status !== notifyStatus.SENDING) {
    notification.completed = new Date()
  }

  await notification.save()
}

export {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications,
  updateNotificationStatus
}
