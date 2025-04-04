import notifyStatus from './notify-statuses.js'

const commEvents = {
  RECEIVED: 'uk.gov.fcp.sfd.notification.received',
  RETRY: 'uk.gov.fcp.sfd.notification.retry',
  SENDING: 'uk.gov.fcp.sfd.notification.sending',
  DELIVERED: 'uk.gov.fcp.sfd.notification.delivered',
  VALIDATION_FAILURE: 'uk.gov.fcp.sfd.notification.failure.validation',
  INTERNAL_FAILURE: 'uk.gov.fcp.sfd.notification.failure.internal',
  PROVIDER_FAILURE: 'uk.gov.fcp.sfd.notification.failure.provider',
  RETRY_EXPIRED: 'uk.gov.fcp.sfd.notification.retry.expired'
}

export const statusToEventMap = {
  [notifyStatus.PERMANENT_FAILURE]: commEvents.PROVIDER_FAILURE,
  [notifyStatus.TEMPORARY_FAILURE]: commEvents.PROVIDER_FAILURE,
  [notifyStatus.TECHNICAL_FAILURE]: commEvents.PROVIDER_FAILURE,
  [notifyStatus.VALIDATION_FAILURE]: commEvents.VALIDATION_FAILURE,
  [notifyStatus.INTERNAL_FAILURE]: commEvents.INTERNAL_FAILURE,
  [notifyStatus.DELIVERED]: commEvents.DELIVERED,
  [notifyStatus.SENDING]: commEvents.SENDING,
  [notifyStatus.CREATED]: commEvents.SENDING
}

export default commEvents
