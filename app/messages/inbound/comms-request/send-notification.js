import crypto from 'crypto'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

const trySendViaNotify = async (message, emailAddress) => {
  try {
    const response = await notifyClient.sendEmail(
      message.data.notifyTemplateId,
      emailAddress, {
        personalisation: message.data.personalisation,
        reference: crypto.randomUUID()
      }
    )

    return [response, null]
  } catch (error) {
    const statusCode = error.response?.data?.status_code
    console.error('Error sending email:', statusCode, undefined)
    return [null, error]
  }
}

const handleNotifyError = async (message, emailAddress, notifyError, receiver) => {
  if (notifyError?.response?.status === 500) {
    console.error('Internal failure sending notification:', notifyError)
    if (receiver) {
      await receiver.abandonMessage(message)
    }
    throw new Error('Technical failure - message abandoned for retry')
  }

  const status = notifyStatus.INTERNAL_FAILURE
  const notifyErrorData = notifyError?.response?.data || {}

  await publishStatus(message, emailAddress, status, notifyErrorData)
  await logRejectedNotification(message, emailAddress, notifyError)
}

const sendNotification = async (message, receiver) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [response, notifyError] = await trySendViaNotify(message, emailAddress)

    try {
      if (response) {
        await publishStatus(message, emailAddress, notifyStatus.SENDING)
        await logCreatedNotification(message, emailAddress, response.data.id)
      } else if (notifyError) {
        await handleNotifyError(message, emailAddress, notifyError, receiver)
      }
    } catch (error) {
      if (error.message === 'Technical failure - message abandoned for retry') {
        throw error
      }
      console.error('Error processing notification:', error)
      throw error // Rethrow to trigger Service Bus retry
    }
  }
}

export { sendNotification }
