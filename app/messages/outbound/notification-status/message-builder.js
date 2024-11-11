import crypto from 'crypto'

const buildStatusMessage = (data, type, statusDetails) => {
  return {
    id: crypto.randomUUID(),
    source: 'fcp-fd-comms',
    specversion: '1.0.2',
    type,
    time: new Date(),
    data: {
      ...data,
      statusDetails: {
        status: statusDetails.status,
        errors: statusDetails.errors
      }
    }
  }
}

export { buildStatusMessage }
