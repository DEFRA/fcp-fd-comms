import notifyClient from '../../clients/notify-client.js'

const getNotifyStatus = async (id) => {
  const { data } = await notifyClient.getNotificationById(id)

  return {
    id: data.id,
    status: data.status
  }
}

export { getNotifyStatus }
