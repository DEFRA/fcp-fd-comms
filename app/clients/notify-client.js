import { NotifyClient } from 'notifications-node-client'
import { notifyConfig } from '../config/index.js'

const notifyClient = new NotifyClient(notifyConfig.get('notifyApiKey'))

export default notifyClient
