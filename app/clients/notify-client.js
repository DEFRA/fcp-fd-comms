import { NotifyClient } from 'notifications-node-client'
import { notifyConfig } from '../config/index.js'

const createNotifyClient = () => {
  if (!notifyConfig.get('mockApi.useMock')) {
    return new NotifyClient(notifyConfig.get('apiKey'))
  }

  return new NotifyClient(
    notifyConfig.get('mockApi.endpoint'),
    notifyConfig.get('apiKey'),
    'random-service-id'
  )
}

const notifyClient = createNotifyClient()

export default notifyClient
