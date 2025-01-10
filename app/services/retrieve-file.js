import * as cleanRepo from '../repos/clean.js'

const retrieveFile = async (path) => {
  const file = await cleanRepo.getObject(path)
  return file
}

export {
  retrieveFile
}
