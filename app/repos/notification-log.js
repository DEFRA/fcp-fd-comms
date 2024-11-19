import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'

const logCreatedNotification = async (message, notificationId) => {
  let emailAddresses = message.body.data.commsAddresses

  if (typeof emailAddresses === 'string') {
    emailAddresses = [emailAddresses]
  } else if (!Array.isArray(emailAddresses)) {
    throw new Error('commsAddresses is neither a string nor an array')
  }

  for (const emailAddress of emailAddresses) {
    await db.notifyApiRequestSuccess.create({
      createdAt: new Date(),
      notifyResponseId: notificationId,
      message: message.body,
      status: notifyStatus.CREATED,
      statusUpdatedAt: new Date(),
      completed: null,
      emailAddress
    })
  }
}

const logRejectedNotification = async (message, notifyError) => {
  let emailAddresses = message.body.data.commsAddresses

  if (typeof emailAddresses === 'string') {
    emailAddresses = [emailAddresses]
  } else if (!Array.isArray(emailAddresses)) {
    throw new Error('commsAddresses is neither a string nor an array')
  }

  for (const emailAddress of emailAddresses) {
    await db.notifyApiRequestFailure.create({
      createdAt: new Date(),
      message: message.body,
      error: notifyError.response.data,
      emailAddress
    })
  }
}

const getPendingNotifications = async () => {
  const pending = await db.notifyApiRequestSuccess.findAll({
    where: {
      completed: null
    }
  })

  return pending.map((notification) => ({
    id: notification.notifyResponseId,
    status: notification.status
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
