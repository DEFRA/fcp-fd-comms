import { MessageSender } from 'ffc-messaging'

import { statusToEventMap } from '../../../constants/comm-events.js'

import { buildUpdateMessage } from './build-message.js'
import { messageConfig } from '../../../config/index.js'

const config = {
  ...messageConfig.get('messageQueue'),
  ...messageConfig.get('dataLayerTopic')
}

const publishStatus = async (message, recipient, status, error) => {
  const sender = new MessageSender(config)

  const type = statusToEventMap[status]

  const statusDetails = {
    status,
    errorCode: error?.status_code,
    errors: error?.errors
  }

  const statusMessage = buildUpdateMessage(message, recipient, type, statusDetails)

  await sender.send(statusMessage)
}

export { publishStatus }
