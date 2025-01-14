import { get } from './base.js'
import { apiConfig } from '../config/index.js'

const fileRetrieverHost = apiConfig.get('fileRetrieverHost')

const getObjectById = async (id) => {
  return get(`${fileRetrieverHost}/objects/${id}`)
}

export {
  getObjectById
}
