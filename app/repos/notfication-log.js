import data from '../constants/mock-notification-log.js'

const getPendingNotifications = () => {
  const notifcations = data
    .filter(n =>
      n.status === 'sending' ||
      n.status === 'created'
    )

  return notifcations.map((n) => ({ id: n.id, status: n.status }))
}

const updateNotificationStatus = (notification, status) => {
  const org = data.find(({ id }) => id === notification.id)

  if (!org) {
    throw new Error(`Notification ${notification.id} not found in data`)
  }

  org.status = status
}

export { getPendingNotifications, updateNotificationStatus }
