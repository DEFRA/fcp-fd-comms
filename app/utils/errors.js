import { addHours } from 'date-fns'

import notifyStatus, { retryableStatus } from '../constants/notify-statuses.js'
import { notifyConfig } from '../config/index.js'

const isServerErrorCode = (code) => {
  return code >= 500 && code < 600
}

const checkRetryable = (status, requestTime) => {
  if (!retryableStatus.includes(status)) {
    return false
  }

  if (status === notifyStatus.TECHNICAL_FAILURE) {
    return true
  }

  const timeoutDate = addHours(
    requestTime,
    notifyConfig.get('messageRetries.temporaryFailureTimeout')
  )

  return Date.now() < timeoutDate
}

export {
  isServerErrorCode,
  checkRetryable
}
