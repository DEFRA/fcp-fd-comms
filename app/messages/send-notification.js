import crypto from 'crypto'
import { NotifyClient } from 'notifications-node-client'
import { notifyConfig } from '../config/index.js'

const sendNotification = async (message) => {
  const notifyClient = new NotifyClient(notifyConfig.get('notifyApiKey'))

  const emailAddresses = Array.isArray(message.body.data.commsAddress)
    ? message.body.data.commsAddress
    : [message.body.data.commsAddress]

  for (const emailAddress of emailAddresses) {
    try {
      await notifyClient.sendEmail(
        message.body.data.notifyTemplateId,
        emailAddress, {
          personalisation: message.body.data.personalisation,
          reference: crypto.randomUUID()
        }
      )
    } catch (error) {
      console.log('Error sending email: ', error)
    }
  }
}

export { sendNotification }
