import crypto from 'crypto'
import notifyClient from '../../clients/notify-client.js'

const trySendViaNotify = async (message, emailAddress) => {
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
    const status = error.response.data.status_code
    console.error('Error sending email with code:', status)
    return [null, error]
  }
}

export { trySendViaNotify }
