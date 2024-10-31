import { NotifyClient } from 'notifications-node-client'

const getNotifyStatus = async (id) => {
  const notifyClient = new NotifyClient(process.env.NOTIFY_API_KEY)

  const { data } = await notifyClient.getNotificationById(id)

  return {
    id: data.id,
    status: data.status
  }
}

export { getNotifyStatus }
