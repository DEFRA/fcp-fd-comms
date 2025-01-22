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
    personalisation[attachment.name] = { file }
  }

  return personalisation
}

export { buildPersonalisation }
