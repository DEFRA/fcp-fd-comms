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
      error: notifyError.response.data
    })
  } catch (error) {
    console.error('Error logging rejected notification: ', error)
  }
}

const getPendingNotifications = async () => {
  try {
    const pending = await db.notifyApiRequestSuccess.findAll({
      where: {
        completed: null
      }
    })

    return pending.map((notification) => ({
      id: notification.notifyResponseId,
      status: notification.status
    }))
  } catch (error) {
    console.error('Error getting pending notifications: ', error)

    throw error
  }
}

const updateNotificationStatus = async (notificationId, status) => {
  try {
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
  } catch (error) {
    console.error('Error updating notification status: ', error)

    throw error
  }
}

export {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications,
  updateNotificationStatus
}
