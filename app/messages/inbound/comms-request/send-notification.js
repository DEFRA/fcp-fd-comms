import { backOff } from 'exponential-backoff'

import { notifyConfig } from '../../../config/index.js'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { isServerErrorCode } from '../../../utils/errors.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'
import { publishRetryRequest } from '../../outbound/notification-retry/publish.js'

const trySendViaNotify = async (message, emailAddress) => {
  try {
    const response = await backOff(() => notifyClient.sendEmail(
      message.data.notifyTemplateId,
      emailAddress, {
        personalisation: message.data.personalisation,
        reference: message.data.correlationId ?? message.id,
        emailReplyToId: message.data.emailReplyToId
      }
    ), {
      maxDelay: notifyConfig.get('apiRetries.maxDelay'),
      numOfAttempts: notifyConfig.get('apiRetries.maxRetries'),
      startingDelay: notifyConfig.get('apiRetries.startingDelay'),
      retry: (error) => {
        const code = error.response?.status

        if (isServerErrorCode(code)) {
          console.warn('Retrying due to GOV Notify error code:', code)
          return true
        }

        return false
      }
    })

    return [response, null]
  } catch (error) {
    const errors = error.response?.data?.errors

    if (!errors) {
      console.error(`Error sending notification via GOV Notify: ${error.message}`)
      throw error
    }

    const errorMessage = errors.reduce((acc, err) => {
      return acc + `${err.message}\n`
    }, '')

    const statusCode = error.response?.status

    console.error(`Failed to send notification via GOV Notify. Error code: ${statusCode}. Message: ${errorMessage}`)

    return [null, error.response]
  }
}

const handleSuccessfulNotification = async (message, emailAddress, id) => {
  try {
    await publishStatus(message, emailAddress, notifyStatus.SENDING)
  } catch (error) {
    console.error('Error publishing notification status to data layer:', error)
  }

  try {
    await logCreatedNotification(message, emailAddress, id)
  } catch (error) {
    console.error('Error logging successful notification:', error)
  }
}

const handleFailedNotification = async (message, emailAddress, notifyError) => {
  const serverError = isServerErrorCode(notifyError?.status)

  const status = serverError === true
    ? notifyStatus.TECHNICAL_FAILURE
    : notifyStatus.INTERNAL_FAILURE

  const errorData = notifyError?.data

  try {
    await publishStatus(message, emailAddress, status, errorData)
  } catch (error) {
    console.error('Error publishing notification status to data layer:', error)
  }

  try {
    await logRejectedNotification(message, emailAddress, errorData)
  } catch (error) {
    console.error('Error logging rejected notification:', error)
  }

  if (serverError) {
    console.log(`Scheduling notification retry for message: ${message.id}`)

    try {
      await publishRetryRequest(message, emailAddress, notifyConfig.get('messageRetries.retryDelay'))
    } catch (error) {
      console.error('Error scheduling notification retry:', error)
    }
  }
}

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [response, notifyError] = await trySendViaNotify(message, emailAddress)

    if (response) {
      await handleSuccessfulNotification(message, emailAddress, response.data.id)
    } else {
      await handleFailedNotification(message, emailAddress, notifyError)
    }
  }
}

export { sendNotification }
