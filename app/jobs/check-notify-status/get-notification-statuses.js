import { NotifyClient } from 'notifications-node-client'

const getNotifyStatus = async (id) => {
  const notifyClient = new NotifyClient(process.env.NOTIFY_API_KEY)

  try {
    const { data } = await notifyClient.getNotificationById(id)

    return { 
      id: data.id,
      status: data.status
    }
  } catch (error) {
    throw new Error(`Error querying notify status for ${id}: ${error.message}`)
  }
}

export { getNotifyStatus }
