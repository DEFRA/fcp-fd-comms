import db from '../data/index.js'

const saveToDatabase = async (message) => {
  try {
    await db.initial.create({
      id: message.body.id,
      message: message.body.message
    })
  } catch (error) {
    console.error(error)
  }
}

export { saveToDatabase }
