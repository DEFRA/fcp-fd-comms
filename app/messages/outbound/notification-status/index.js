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
    error: error?.data
  }

  const statusMessage = buildUpdateMessage(message, type, recipient, statusDetails)

  console.log('Publishing status message:', statusMessage)

  await sender.send(statusMessage)
}

export { publishStatus }
