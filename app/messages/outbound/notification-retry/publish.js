import { MessageSender } from 'ffc-messaging'
import { addMinutes } from 'date-fns'

import { messageConfig } from '../../../config/index.js'
import commEvents from '../../../constants/comm-events.js'

const config = {
  ...messageConfig.get('messageQueue'),
  ...messageConfig.get('receiverSubscription')
}

const publishRetryRequest = async (message, recipient, delay) => {
  const sender = new MessageSender(config)

  const retryMessage = {
    body: {
      ...message,
      id: crypto.randomUUID(),
      type: commEvents.RETRY,
      time: new Date().toISOString(),
      data: {
        ...message.data,
        correlationId: message.data.correlationId ?? message.id,
        commsAddresses: recipient
      }
    },
    source: message.source,
    type: commEvents.RETRY
  }

  const enriched = sender.enrichMessage(retryMessage)

  await sender.scheduleMessage(enriched, addMinutes(Date.now(), delay))
}

export { publishRetryRequest }
