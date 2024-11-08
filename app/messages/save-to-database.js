import db from '../data/index.js'

const saveToDatabase = async (message) => {
  try {
    if (message.body.notifyResponseId) {
      await db.notifyApiRequestSuccess.create({
        createdAt: new Date(),
        notifyResponseId: message.body.notifyResponseId,
        message: message.body,
        status: message.body.status,
        statusUpdatedAt: new Date(),
        completed: null
      })
    } else {
      await db.notifyApiRequestFailure.create({
        createdAt: new Date(),
        message: message.body,
        error: message.body.error
      })
    }
  } catch (error) {
    console.error(error)
  }
}

export { saveToDatabase }
