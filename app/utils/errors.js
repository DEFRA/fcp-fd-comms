import { notifyConfig } from '../config/index.js'

import notifyStatus from '../constants/notify-statuses.js'

const temporaryFailureTimeout = notifyConfig.get('messageRetries.temporaryFailureTimeout')
const technicalFailureTimeout = notifyConfig.get('messageRetries.technicalFailureTimeout')

const isServerErrorCode = (code) => {
  return code >= 500 && code < 600
}

const shouldRetryMessage = (date, errorType) => {
  if (errorType === notifyStatus.TEMPORARY_FAILURE) {
    return new Date() - date < temporaryFailureTimeout
  }

  if (errorType === notifyStatus.TECHNICAL_FAILURE) {
    return new Date() - date < technicalFailureTimeout
  }

  throw new Error(`Unknown error type: ${errorType}`)
}

export {
  isServerErrorCode,
  shouldRetryMessage
}
