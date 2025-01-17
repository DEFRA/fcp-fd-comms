import { getObjectById } from '../api/files.js'

const retrieveFile = async (path) => {
  const file = await getObjectById(path)
  return file.toString('base64')
}

export {
  retrieveFile
}
