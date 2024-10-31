const mockData = [
  {
    id: 'eb12be08-91aa-4bc2-8e4a-1b95214da178',
    status: 'sending'
  },
  {
    id: '127742b6-c705-4fc3-be1d-6a193e83490e',
    status: 'sending'
  },
  {
    id: 'c3f864f3-1e37-4a1b-834b-e01b4349d380',
    status: 'created'
  },
  {
    id: '95f281fd-dbc2-4ec0-a33d-ff5e7cc25244',
    status: 'delivered'
  }
]

const getPendingNotifications = () => {
  const notifcations = mockData
    .filter(n =>
      n.status === 'sending' ||
      n.status === 'created'
    )

  return notifcations.map((n) => ({ id: n.id, status: n.status }))
}

const updateNotificationStatus = (notification, status) => {
  const org = mockData.find(({ id }) => id === notification.id)

  if (!org) {
    console.log(`Notification ${notification.id} not found in data`)

    return
  }

  org.status = status
}

export { getPendingNotifications, updateNotificationStatus }
