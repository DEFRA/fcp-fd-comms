import crypto from 'crypto'

import notifyClient from '../../../clients/notify-client.js'
import notifyStatus from '../../../constants/notify-statuses.js'

import { logCreatedNotification, logRejectedNotification } from '../../../repos/notification-log.js'
import { publishStatus } from '../../outbound/notification-status/publish.js'

import { retrieveFile } from '../../../services/retrieve-file.js'

const buildPersonalisation = async (message) => {
  if (!message.data.attachments) {
    return message.data.personalisation
  }

  const attachments = Array.isArray(message.data.attachments)
    ? message.data.attachments
    : [message.data.attachments]

  const personalisation = { ...message.data.personalisation }

  for (const attachment of attachments) {
    const file = await retrieveFile(attachment.id)
    const base64 = file.toString('base64')
    personalisation[attachment.name] = { file: base64 }
  }

  return personalisation
}

const trySendViaNotify = async (message, emailAddress, personalisation) => {
  try {
    const response = await notifyClient.sendEmail(
      message.data.notifyTemplateId,
      emailAddress, {
        personalisation,
        reference: crypto.randomUUID()
      }
    )

    return [response, null]
  } catch (error) {
    const status = error.response.data.status_code

    console.error('Error sending email with code:', status)

    return [null, error]
  }
}

const sendNotification = async (message) => {
  const personalisation = await buildPersonalisation(message)

  const emailAddresses = Array.isArray(message.data.commsAddresses)
    ? message.data.commsAddresses
    : [message.data.commsAddresses]

  for (const emailAddress of emailAddresses) {
    const [response, notifyError] = await trySendViaNotify(message, emailAddress, personalisation)

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
}

export { sendNotification }
