import { retrieveFile } from '../services/retrieve-file.js'

const objects = {
  method: 'GET',
  path: '/objects/{path}',
  handler: async (request, h) => {
    const { path } = request.params
    const file = await retrieveFile(path)
    return h.response(file).code(200)
  }
}

export default objects
