import { MessageSender } from 'ffc-messaging'

import { messageConfig } from '../../../config/index.js'

const config = {
  ...messageConfig.get('messageQueue'),
  ...messageConfig.get('receiverSubscription')
}

const publishRetryRequest = async (message, recipient) => {
  const sender = new MessageSender(config)

  const retryMessage = {
    body: {
      ...message,
      data: {
        ...message.data,
        commsAddresses: recipient
      }
    },
    source: message.source,
    type: message.type
  }

  await sender.sendMessage(retryMessage)
}

export { publishRetryRequest }
