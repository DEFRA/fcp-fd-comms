import { v4 as uuidv4 } from 'uuid'
import { NotifyClient } from 'notifications-node-client'

const farmerApply = async (message) => {
  const notifyClient = new NotifyClient(process.env.NOTIFY_API_KEY)

  await notifyClient.sendEmail(
    process.env.CONFIRM_NEW_USER_NOTIFY_TEMPLATE_ID,
    process.env.NOTIFY_TEST_EMAIL, {
      personalisation: {
        reference: message.body.data.personalisation.reference,
        agreementSummaryLink: message.body.data.personalisation.agreementSummaryLink
      },
      reference: uuidv4()
    })
}

export { farmerApply }
