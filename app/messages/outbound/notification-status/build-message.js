import crypto from 'crypto'

import { SOURCE } from '../../../constants/source.js'

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
        commsAddress: recipient,
        correlationId: message.id,
        statusDetails
      },
      datacontenttype: 'application/json',
      specschema: '1.0'
    }
  },
  source: SOURCE,
  type
})

export { buildUpdateMessage }
