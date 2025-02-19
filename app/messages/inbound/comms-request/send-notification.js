import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

// Temporary flag for testing 500 error handling - set to true to simulate the error
const SIMULATE_500_ERROR = true

const sendNotification = async (message, receiver) => {
  console.log('sendNotification called with message:', message)
  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    await processEmailAddress(message, emailAddress, receiver)
  }
}

const processEmailAddress = async (message, emailAddress, receiver) => {
  console.log('Processing email address:', emailAddress)
  const [response, notifyError] = await trySendViaNotify(message, emailAddress)

  if (response) {
    console.log('Email sent successfully:', response.data.id)
    await publishStatus(message, emailAddress, notifyStatus.SENDING)
    await logCreatedNotification(message, emailAddress, response.data.id)
    return
  }

  if (!notifyError) { return }

  try {
    await handleNotifyError(message, emailAddress, notifyError, receiver)
  } catch (error) {
    if (error.message !== 'Technical failure - message abandoned for retry') {
      console.error('Error processing notification:', error)
    }
    throw error // Rethrow to trigger Service Bus retry
  }
}

const trySendViaNotify = async (message, emailAddress) => {
  console.log('Attempting to send email via Notify for:', emailAddress)
  // Temporary code for testing 500 error handling
  if (SIMULATE_500_ERROR) {
    const error = new Error('Technical failure - message abandoned for retry')
    error.response = {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      data: {
        errors: [{
          error: 'Simulated 500 error for testing'
        }]
      }
    }
    console.error('Simulated 500 error:', error)
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
    console.error('Error sending email:', statusCode, undefined)
    return [null, error]
  }
}

const handleNotifyError = async (message, emailAddress, notifyError, receiver) => {
  console.error('Handling Notify error for:', emailAddress, 'Error:', notifyError)
  if (notifyError?.response?.status === StatusCodes.INTERNAL_SERVER_ERROR) {
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

export { sendNotification }
