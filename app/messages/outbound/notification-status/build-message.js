import crypto from 'crypto'

import { SOURCE } from '../../../constants/source.js'

const buildUpdateMessage = (message, type, statusDetails) => ({
  body: {
    id: crypto.randomUUID(),
    commsMessage: {
      ...message,
      source: SOURCE,
      type,
      time: new Date(),
      data: {
        ...message.data,
        statusDetails
      }
    }
  },
  source: SOURCE,
  type
})

export { buildUpdateMessage }
