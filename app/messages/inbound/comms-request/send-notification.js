import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

// Temporary flags for testing error handling - set to true to simulate the errors
const SIMULATE_500_ERROR = false
const SIMULATE_400_ERROR = false

const trySendViaNotify = async (message, emailAddress) => {
  // Temporary code for testing 500 error handling
  if (SIMULATE_500_ERROR) {
    const error = new Error('NOTIFY_RETRY_ERROR')
    error.response = {
      data: {
        status_code: StatusCodes.INTERNAL_SERVER_ERROR,
        errors: [{
          error: 'Simulated 500 error for testing'
        }]
      }
    }
    console.log(`Simulated 500 error for ${emailAddress}`)
    return [null, error]
  }

  // Temporary code for testing 400 error handling
  if (SIMULATE_400_ERROR) {
    const error = new Error('Bad request - invalid input data')
    error.response = {
      data: {
        status_code: StatusCodes.BAD_REQUEST,
        errors: [{
          error: 'Simulated 400 error for testing'
        }]
      }
    }
    console.error('Simulated 400 error:', error)
    return [null, error]
  }

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
    console.error('Error sending email:', statusCode, error.message)
    return [null, error]
  }
}

const processEmailAddress = async (message, emailAddress, _receiver) => {
  console.log('\n---')
  console.log('\nProcessing email for', emailAddress)
  const [response, notifyError] = await trySendViaNotify(message, emailAddress)

  if (notifyError.response.data.status_code === StatusCodes.INTERNAL_SERVER_ERROR) {
    console.log('Gov Notify failure')
    throw new Error('Gov Notify Technical failure', {
      cause: notifyStatus.TECHNICAL_FAILURE
    })
  }

  try {
    if (response) {
      await publishStatus(message, emailAddress, notifyStatus.SENDING)
      await logCreatedNotification(message, emailAddress, response.data.id)
    } else {
      const status = notifyStatus.INTERNAL_FAILURE
      const notifyErrorData = notifyError.response.data
      await publishStatus(message, emailAddress, status, notifyErrorData)
      await logRejectedNotification(message, emailAddress, notifyError)
    }
  } catch (error) {
    console.error('Error logging notification: ', error)
  }
}

const sendNotification = async (message, receiver) => {
  console.log('---')
  console.log('sendNotification called')
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    await processEmailAddress(message, emailAddress, receiver)
  }
}

export { sendNotification }
