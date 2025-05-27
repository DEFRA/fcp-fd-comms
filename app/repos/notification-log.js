import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'
import { DatabaseError } from '../errors/database-error.js'

const logCreatedNotification = async (message, recipient, notificationId) => {
  try {
    await db.notifyApiRequestSuccess.create({
      createdAt: new Date(),
      notifyResponseId: notificationId,
      message,
      status: notifyStatus.CREATED,
      statusUpdatedAt: new Date(),
      completed: null,
      recipient
    })
  } catch (error) {
    throw new DatabaseError(`Failed to log created notification: ${error.message}`)
  }
}

const logRejectedNotification = async (message, recipient, errorData) => {
  try {
    await db.notifyApiRequestFailure.create({
      createdAt: new Date(),
      message,
      error: errorData,
      recipient
    })
  } catch (error) {
    throw new DatabaseError(`Failed to log rejected notification: ${error.message}`)
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
      status: notification.status,
      createdAt: notification.createdAt,
      message: notification.message,
      recipient: notification.recipient
    }))
  } catch (error) {
    throw new DatabaseError(`Failed to get pending notifications: ${error.message}`)
  }
}

const getOriginalNotificationRequest = async (correlationId) => {
  try {
    const notification = await db.notifyApiRequestSuccess.findOne({
      where: {
        'message.id': correlationId
      }
    })

    if (!notification) {
      throw new DatabaseError(`No notification found for correlation ID: ${correlationId}`)
    }

    return {
      id: notification.notifyResponseId,
      createdAt: notification.createdAt,
      status: notification.status,
      message: notification.message,
      recipient: notification.recipient
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Failed to get original notification request: ${error.message}`)
  }
}

const updateNotificationStatus = async (notificationId, status) => {
  try {
    const notification = await db.notifyApiRequestSuccess.findOne({
      where: {
        notifyResponseId: notificationId
      }
    })

    if (!notification) {
      throw new DatabaseError(`No notification found for ID: ${notificationId}`)
    }

    notification.status = status
    notification.statusUpdatedAt = new Date()

    if (status !== notifyStatus.CREATED && status !== notifyStatus.SENDING) {
      notification.completed = new Date()
    }

    await notification.save()
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Failed to update notification status: ${error.message}`)
  }
}

const checkDuplicateNotification = async (messageId) => {
  try {
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
  } catch (error) {
    throw new DatabaseError(`Failed to check duplicate notification: ${error.message}`)
  }
}

export {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications,
  getOriginalNotificationRequest,
  updateNotificationStatus,
  checkDuplicateNotification
}
