import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'

const logCreatedNotification = async (message, notificationId) => {
  try {
    await db.notifyApiRequestSuccess.create({
      createdAt: new Date(),
      notifyResponseId: notificationId,
      message: message.body,
      status: notifyStatus.CREATED,
      statusUpdatedAt: new Date(),
      completed: null
    })
  } catch (error) {
    console.error('Error logging created notification: ', error)
  }
}

const logRejectedNotification = async (message, notifyError) => {
  try {
    await db.notifyApiRequestFailure.create({
      createdAt: new Date(),
      message: message.body,
      error: notifyError
    })
  } catch (error) {
    console.error('Error logging rejected notification: ', error)
  }
}

export { logCreatedNotification, logRejectedNotification }
