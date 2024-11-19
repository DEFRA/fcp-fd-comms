import crypto from 'crypto'

import { SOURCE } from '../../../constants/source.js'

const buildUpdateMessage = (message, type, recipient, statusDetails) => {
  return {
    body: {
      id: crypto.randomUUID(),
      commsMessage: {
        source: 'fcp-fd-comms',
        specversion: '1.0.2',
        type,
        time: new Date(),
        data: {
          ...message.data,
          commsAddresses: recipient,
          statusDetails: {
            status: statusDetails.status,
            errors: statusDetails.errors
          }
        }
      }
    },
    source: SOURCE,
    type
  }
}

export { buildUpdateMessage }
