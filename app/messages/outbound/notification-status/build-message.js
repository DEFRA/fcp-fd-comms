import crypto from 'crypto'

import { SOURCE } from '../../../constants/source.js'

const buildReceivedMessage = (message, type) => ({
  body: {
    id: crypto.randomUUID(),
    commsMessage: {
      id: crypto.randomUUID(),
      source: SOURCE,
      type,
      time: new Date(),
      data: {
        ...message.data,
        correlationId: message.id
      },
      datacontenttype: 'application/json',
      specversion: '1.0'
    }
  },
  source: SOURCE,
  type
})

const buildUpdateMessage = (message, recipient, type, statusDetails) => ({
  body: {
    id: crypto.randomUUID(),
    commsMessage: {
      id: crypto.randomUUID(),
      source: SOURCE,
      type,
      time: new Date(),
      data: {
        ...message.data,
        commsAddresses: recipient,
        correlationId: message.id,
        statusDetails
      },
      datacontenttype: 'application/json',
      specversion: '1.0'
    }
  },
  source: SOURCE,
  type
})

const buildInvalidMessage = (message, type, statusDetails) => ({
  body: {
    id: crypto.randomUUID(),
    commsMessage: {
      id: crypto.randomUUID(),
      source: SOURCE,
      type,
      time: new Date(),
      data: {
        ...message.data,
        correlationId: message.id,
        statusDetails
      },
      datacontenttype: 'application/json',
      specversion: '1.0'
    }
  },
  source: SOURCE,
  type
})

export {
  buildUpdateMessage,
  buildReceivedMessage,
  buildInvalidMessage
}
