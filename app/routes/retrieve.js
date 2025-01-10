import { handleFileRetrieval } from '../services/retrieve.js'
import { convertToBase64 } from '../utils/convert-to-base64.js'

const objects = {
  method: 'GET',
  path: '/objects/{path}',
  handler: async (request, h) => {
    const { path } = request.params
    const file = await handleFileRetrieval(path)
    const base64 = await convertToBase64(file)
    return h.response(base64).code(200)
  }
}

export default objects
