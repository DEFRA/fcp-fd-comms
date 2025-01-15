import { apiConfig } from '../config/index.js'

const baseUrl = apiConfig.get('fileRetriever.host')

const getObjectById = async (id) => {
  const response = await fetch(`${baseUrl}/objects/${id}`)

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.statusText}`)
  }

  const file = await response.arrayBuffer()

  return Buffer.from(file)
}

export {
  getObjectById
}
