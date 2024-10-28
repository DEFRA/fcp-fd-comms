import { v4 as uuidv4 } from 'uuid'
import { NotifyClient } from 'notifications-node-client'

const sendNotification = async (message) => {
  const notifyClient = new NotifyClient(process.env.NOTIFY_API_KEY)

  await notifyClient.sendEmail(
    message.body.data.notifyTemplateId,
    message.body.data.commsAddress, {
      personalisation: {
        reference: message.body.data.personalisation.reference,
        agreementSummaryLink: message.body.data.personalisation.agreementSummaryLink
      },
      reference: uuidv4()
    })
}

export { sendNotification }
