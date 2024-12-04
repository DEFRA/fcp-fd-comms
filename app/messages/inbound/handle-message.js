import { getVersionHandler } from './get-version-handler.js'

const handleMessage = async (message, receiver) => {
  try {
    const versionHandler = getVersionHandler(message.body.type)
    await versionHandler(message.body)
    await receiver.completeMessage(message)
  } catch (error) {
    console.error('Error handling message: ', error)
    await receiver.abandonMessage(message)
  }
}

export { handleMessage }
