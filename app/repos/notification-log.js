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

const logRejectedNotification = async (message, recipient, errorData) => {
  await db.notifyApiRequestFailure.create({
    createdAt: new Date(),
    message,
    error: errorData,
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
    message: notification.message,
    recipient: notification.recipient
  }))
}

const getOriginalNotificationRequest = async (correlationId) => {
  const notification = await db.notifyApiRequestSuccess.findOne({
    where: {
      'message.id': correlationId
    }
  })

  return notification.map((n) => ({
    id: n.notifyResponseId,
    status: n.status,
    message: n.message,
    recipient: n.recipient
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

const checkDuplicateNotification = async (messageId) => {
  const existingSuccess = await db.notifyApiRequestSuccess.findOne({
    where: {
      'message.id': messageId
    }
  })

  const existingFailure = await db.notifyApiRequestFailure.findOne({
    where: {
      'message.id': messageId
    }
  })

  return existingSuccess !== null || existingFailure !== null
}

export {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications,
  getOriginalNotificationRequest,
  updateNotificationStatus,
  checkDuplicateNotification
}
