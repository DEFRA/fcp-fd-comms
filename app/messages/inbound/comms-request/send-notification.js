import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

// Temporary flags for testing error handling - set to true to simulate the errors
const SIMULATE_500_ERROR = false
const SIMULATE_400_ERROR = false

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

const processEmailAddress = async (message, emailAddress, _receiver) => {
  console.log('\n---')
  console.log('\nProcessing email for', emailAddress)
  const [response, notifyError] = await trySendViaNotify(message, emailAddress)

  if (response) {
    console.log(`Email sent successfully to ${emailAddress} (ID: ${response.data.id})`)
    await publishStatus(message, emailAddress, notifyStatus.SENDING)
    await logCreatedNotification(message, emailAddress, response.data.id)
    return
  }

  if (!notifyError) { return }

  try {
    await handleNotifyError(message, emailAddress, notifyError)
  } catch (error) {
    if (error.message === 'NOTIFY_RETRY_ERROR') {
      console.log(`Message for ${emailAddress} will be retried`)
    }
    throw error
  }
}

const trySendViaNotify = async (message, emailAddress) => {
  // Temporary code for testing 500 error handling
  if (SIMULATE_500_ERROR) {
    const error = new Error('NOTIFY_RETRY_ERROR')
    error.response = {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      data: {
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
      status: StatusCodes.BAD_REQUEST,
      data: {
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

const handleNotifyError = async (message, emailAddress, notifyError) => {
  const status = notifyError?.response?.status

  if (status === StatusCodes.INTERNAL_SERVER_ERROR) {
    console.log(`500 error for ${emailAddress} - Will retry`)
    throw new Error('NOTIFY_RETRY_ERROR')
  }

  console.log(`${status} error for ${emailAddress} - Logging failure`)
  const notifyErrorData = notifyError?.response?.data || {}

  await publishStatus(message, emailAddress, status, notifyErrorData)
  await logRejectedNotification(message, emailAddress, notifyError)
  throw notifyError
}

export { sendNotification }
