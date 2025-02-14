// import crypto from 'crypto'
// import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'
import { logCreatedNotification, logRejectedNotification, checkDuplicateNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

const trySendViaNotify = async (message, emailAddress) => {
  // temporarily removed for testing purposes
//   try {
//     const response = await notifyClient.sendEmail(
//       message.data.notifyTemplateId,
//       emailAddress, {
//         personalisation: message.data.personalisation,
//         reference: crypto.randomUUID()
//       }
//     )

  //     return [response, null]
  //   } catch (error) {
  //     const statusCode = error.response?.data?.status_code
  //     console.error('Error sending email with code:', statusCode)
  //     return [null, error]
  //   }
  // }

  // Simulate a 500 error for testing purposes
  try {
    const error = new Error('Simulated 500 error')
    error.response = {
      status: 500,
      data: {
        errors: [
          {
            error: 'simulated-error'
          }
        ]
      }
    }
    throw error
  } catch (error) {
    const statusCode = error.response?.status
    console.error('Error sending email with code:', statusCode)
    return [null, error]
  }
}

const sendNotification = async (message, receiver) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const duplicate = await checkDuplicateNotification(message.id, emailAddress)

    if (duplicate) {
      console.warn('Duplicate notification detected')
      continue
    }

    const [response, notifyError] = await trySendViaNotify(message, emailAddress)

    try {
      if (response) {
        await publishStatus(message, emailAddress, notifyStatus.SENDING)
        await logCreatedNotification(message, emailAddress, response.data.id)
      } else {
        if (notifyError.response.status === 500) {
          throw new Error('NOTIFY_RETRY_ERROR')
        } else {
          const status = notifyStatus.INTERNAL_FAILURE
          const notifyErrorData = notifyError.response.data
          await publishStatus(message, emailAddress, status, notifyErrorData)
          await logRejectedNotification(message, emailAddress, notifyError)
        }
      }
    } catch (error) {
      if (error.message === 'NOTIFY_RETRY_ERROR') {
        // Re-throw to be caught by handler
        throw error
      }
      console.error('Error logging notification:', error)
    }
  }
}

export { sendNotification }
