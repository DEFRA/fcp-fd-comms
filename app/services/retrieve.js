import * as cleanRepo from '../repos/clean.js'
// import { convertToBase64 } from '../utils/convert-to-base64.js'

const handleFileRetrieval = async (path) => {
  const file = await cleanRepo.getObject(path)
  console.log('File successfully retrieved from clean storage.')
  // const base64 = convertToBase64(file)
  // console.log(base64) // remove before merging
  return file
}

export {
  handleFileRetrieval
}
