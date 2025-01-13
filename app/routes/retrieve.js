// import { retrieveFile } from '../services/retrieve-file.js'
import Wreck from '@hapi/wreck'
// import { serverConfig } from '../config/index.js'

// const objects = {
//   method: 'GET',
//   path: '/objects/{path}',
//   handler: async (request, h) => {
//     const { path } = request.params
//     const file = await retrieveFile(path)
//     return h.response(file).code(200)
//   }
// }

// export default objects

const objects = {
  method: 'GET',
  path: '/objects/{path}',
  handler: async (request, h) => {
    const { path } = request.params
    const { payload } = await Wreck.get(`http://fcp-fd-file-retriever:3042/objects/${path}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      json: true
    })

    const file = payload.data.attachment
    return h.response(file).code(200)
  }
}

export default objects
