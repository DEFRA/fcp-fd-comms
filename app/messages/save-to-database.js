import db from '../data/index.js'
import notifyStatus from '../constants/notify-statuses.js'

const saveToDatabase = async (message, response, err) => {
  try {
    if (response.data.id) {
      await db.notifyApiRequestSuccess.create({
        createdAt: new Date(),
        notifyResponseId: response.data.id,
        message: message.body,
        status: notifyStatus.CREATED,
        statusUpdatedAt: new Date(),
        completed: null
      })
    } else if (err) {
      await db.notifyApiRequestFailure.create({
        createdAt: new Date(),
        message: message.body,
        error: err.response.data
      })
    }
  } catch (error) {
    console.error(error)
  }
}

export { saveToDatabase }
