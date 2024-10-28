import crypto from 'crypto'
import { NotifyClient } from 'notifications-node-client'

const sendNotification = async (message) => {
  const notifyClient = new NotifyClient(process.env.NOTIFY_API_KEY)

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
      throw new Error('Error sending email: ', error)
    }
  }
}

export { sendNotification }
