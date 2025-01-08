import { containers } from '../storage/blob/clean.js'

const { objects: cleanObjects } = containers

const getObject = async (path) => {
  const blob = cleanObjects.getBlockBlobClient(path)
  return await blob.downloadToBuffer()
}

export {
  getObject
}
