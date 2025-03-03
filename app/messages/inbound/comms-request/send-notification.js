import crypto from 'crypto'
import { backOff } from 'exponential-backoff'

import { notifyConfig } from '../../../config/index.js'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification, checkDuplicateNotification } from '../../../repos/notification-log.js'
import { isServerErrorCode } from '../../../utils/errors.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

const trySendViaNotify = async (message, emailAddress) => {
  try {
    const response = await backOff(() => notifyClient.sendEmail(
      message.data.notifyTemplateId,
      emailAddress, {
        personalisation: message.data.personalisation,
        reference: crypto.randomUUID()
      }
    ), {
      maxDelay: notifyConfig.get('retries.maxDelay'),
      numOfAttempts: notifyConfig.get('retries.maxRetries'),
      startingDelay: notifyConfig.get('retries.startingDelay'),
      retry: (e) => {
        const code = e.response?.status

        if (isServerErrorCode(code)) {
          console.warn(`Retrying due to Notify API error: ${code}`)
          return true
        }

        return false
      }
    })

    return [response, null]
  } catch (error) {
    console.error('Error sending email with code:', error.response?.status)

    return [null, error]
  }
}

const sendNotification = async (message) => {
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
        let status = notifyStatus.INTERNAL_FAILURE

        if (isServerErrorCode(notifyError.response?.status)) {
          status = notifyStatus.TECHNICAL_FAILURE
        }

        const notifyErrorData = notifyError.response.data

        await publishStatus(message, emailAddress, status, notifyErrorData)
        await logRejectedNotification(message, emailAddress, notifyError)
      }
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }
}

export { sendNotification }
