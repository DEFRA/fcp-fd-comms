import crypto from 'crypto'
import notifyClient from '../clients/notify-client.js'
import { saveToDatabase } from './save-to-database.js'

const sendNotification = async (message) => {
  const emailAddresses = Array.isArray(message.body.data.commsAddress)
    ? message.body.data.commsAddress
    : [message.body.data.commsAddress]

  for (const emailAddress of emailAddresses) {
    try {
      const response = await notifyClient.sendEmail(
        message.body.data.notifyTemplateId,
        emailAddress, {
          personalisation: message.body.data.personalisation,
          reference: crypto.randomUUID()
        }
      )
      console.log('Notify response id: ', response.data.id)
      console.log('Notfiy response: ', response.data)
      console.log('Message body: ', message.body)
      await saveToDatabase(message, response, null)
    } catch (error) {
      console.log('Error sending email: ', error)
      await saveToDatabase(message, error, null)
    }
  }
}

export { sendNotification }
