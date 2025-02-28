import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'
import { StatusCodes } from 'http-status-codes'

import { Op, literal } from 'sequelize'

const nonFailureStatuses = [
  notifyStatus.CREATED,
  notifyStatus.SENDING,
  notifyStatus.DELIVERED
]

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
    message: notification.message,
    recipient: notification.recipient
  }))
}

const getTechnicalFailures = async () => {
  const syncFailures = await db.notifyApiRequestFailure.findAll({
    attributes: ['message', 'recipient'],
    where: {
      [Op.and]: [
        {
          'error.status_code': StatusCodes.INTERNAL_SERVER_ERROR
        },
        {
          1: literal(`
            NOT EXISTS (
              SELECT 1
              FROM "notifyApiRequestSuccess" s
              WHERE s.message->>'id' = "notifyApiRequestFailure".message->>'id'
              AND s.recipient = "notifyApiRequestFailure".recipient
              AND s.status IN ('created', 'sending', 'delivered')
            )
          `)
        }
      ]
    }
  })

  const asyncFailures = await db.notifyApiRequestSuccess.findAll({
    attributes: ['message', 'recipient'],
    where: {
      [Op.and]: [
        {
          status: notifyStatus.TECHNICAL_FAILURE
        },
        {
          1: literal(`
            NOT EXISTS (
              SELECT 1
              FROM "notifyApiRequestSuccess" s
              WHERE s.message->>'id' = "notifyApiRequestSuccess".message->>'id'
              AND s.recipient = "notifyApiRequestSuccess".recipient
              AND s.status IN ('created', 'sending', 'delivered')
            )
          `)
        }
      ]
    }
  })

  return [...syncFailures, ...asyncFailures]
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

const checkDuplicateNotification = async (messageId, recipient) => {
  const existing = await db.notifyApiRequestSuccess.findOne({
    where: {
      'message.id': messageId,
      recipient
    }
  })

  return nonFailureStatuses.includes(existing?.status)
}

export {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications,
  getTechnicalFailures,
  updateNotificationStatus,
  checkDuplicateNotification
}
