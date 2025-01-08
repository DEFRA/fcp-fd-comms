import * as cleanRepo from '../repos/clean.js'

const handleFileRetrieval = async (path) => {
  const file = await cleanRepo.getObject(path)
  console.log(`File ${path} retrieved from clean storage.`)
  return file
}

export {
  handleFileRetrieval
}
