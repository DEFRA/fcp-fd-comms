import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'

const logCreatedNotification = async (message, notificationId) => {
  await db.notifyApiRequestSuccess.create({
    createdAt: new Date(),
    notificationId,
    message: message.body,
    status: notifyStatus.CREATED,
    statusUpdatedAt: new Date(),
    completed: null
  })
}

const logFailedNotification = async (message, error) => {
  await db.notifyApiRequestFailure.create({
    createdAt: new Date(),
    message: message.body,
    error: error.response.data
  })
}

export { logCreatedNotification, logFailedNotification }
