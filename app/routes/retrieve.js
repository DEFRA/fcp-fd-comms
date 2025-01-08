import { handleFileRetrieval } from '../services/retrieve.js'

const objects = {
  method: 'GET',
  path: '/objects/{path}',
  handler: async (request, h) => {
    const { path } = request.params

    const file = await handleFileRetrieval(path)

    console.log('file:', file)
    return h.response(file).code(200)
  }
}

export default objects
