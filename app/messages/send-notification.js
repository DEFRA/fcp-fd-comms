import crypto from 'crypto'
import { NotifyClient } from 'notifications-node-client'

const sendNotification = async (message) => {
  const notifyClient = new NotifyClient(process.env.NOTIFY_API_KEY)

  const emailAddresses = Array.isArray(message.body.data.commsAddress)
    ? message.body.data.commsAddress
    : [message.body.data.commsAddress]

  for (const emailAddress of emailAddresses) {
    await notifyClient.sendEmail(
      message.body.data.notifyTemplateId,
      emailAddress, {
        personalisation: {
          reference: message.body.data.personalisation.reference,
          agreementSummaryLink: message.body.data.personalisation.agreementSummaryLink
        },
        reference: crypto.randomUUID()
      }
    )
  }
}

export { sendNotification }
