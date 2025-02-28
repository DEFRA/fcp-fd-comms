import { publishRetryRequest } from '../../messages/outbound/notification-retry/publish.js'
import { getTechnicalFailures } from '../../repos/notification-log.js'

const retryTechnicalFailuresHandler = async () => {
  console.log('Retrying technical failures')

  const failures = await getTechnicalFailures()

  for (const failure of failures) {
    console.log(`Retrying technical failure for recipient ${failure.recipient}`)

    await publishRetryRequest(failure.message)
  }
}

export { retryTechnicalFailuresHandler }
