import * as cleanRepo from '../repos/clean.js'
import { convertToBase64 } from '../utils/convert-to-base64.js'

const handleFileRetrieval = async (path) => {
  const file = await cleanRepo.getObject(path)
  console.log(`File ${path} retrieved from clean storage.`)
  console.log(convertToBase64(file))
  return file
}

export {
  handleFileRetrieval
}
