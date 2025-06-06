export const notifyStatus = {
  CREATED: 'created',
  SENDING: 'sending',
  DELIVERED: 'delivered',
  PERMANENT_FAILURE: 'permanent-failure',
  TEMPORARY_FAILURE: 'temporary-failure',
  TECHNICAL_FAILURE: 'technical-failure',
  INTERNAL_FAILURE: 'internal-failure',
  VALIDATION_FAILURE: 'validation-failure'
}

export const finishedStatus = [
  notifyStatus.DELIVERED,
  notifyStatus.INTERNAL_FAILURE,
  notifyStatus.TEMPORARY_FAILURE,
  notifyStatus.PERMANENT_FAILURE,
  notifyStatus.TECHNICAL_FAILURE
]

export const retryableStatus = [
  notifyStatus.TEMPORARY_FAILURE,
  notifyStatus.TECHNICAL_FAILURE
]

export default notifyStatus
