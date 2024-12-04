import { MessageSender } from 'ffc-messaging'

import commEvents, { statusToEventMap } from '../../../constants/comm-events.js'

import { buildUpdateMessage, buildReceivedMessage, buildInvalidMessage } from './build-message.js'
import { messageConfig } from '../../../config/index.js'
import notifyStatus from '../../../constants/notify-statuses.js'

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

const publishReceived = async (message) => {
  const sender = new MessageSender(config)

  const receivedMessage = buildReceivedMessage(message, commEvents.RECEIVED)

  await sender.send(receivedMessage)
}

const publishInvalidRequest = async (message, errors) => {
  const sender = new MessageSender(config)

  const statusDetails = {
    status: notifyStatus.VALIDATION_FAILURE,
    errors
  }

  const invalidMessage = buildInvalidMessage(message, commEvents.VALIDATION_FAILURE, statusDetails)

  await sender.send(invalidMessage)
}

export { publishStatus, publishReceived, publishInvalidRequest }
