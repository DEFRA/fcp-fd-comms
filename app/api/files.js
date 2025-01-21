import { apiConfig } from '../config/index.js'

const baseUrl = apiConfig.get('fileRetriever.url')

const getObjectById = async (id) => {
  const response = await fetch(`${baseUrl}/objects/${id}`)

  if (!response.ok) {
    throw new Error(`Error retrieving file ${id}: ${response.statusText}`)
  }

  const file = await response.arrayBuffer()

  return Buffer.from(file)
}

export {
  getObjectById
}
