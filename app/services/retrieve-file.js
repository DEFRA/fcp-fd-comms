import { getObjectById } from '../api/files.js'

const retrieveFile = async (path) => {
  return getObjectById(path)
}

export {
  retrieveFile
}
