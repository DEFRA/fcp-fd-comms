import Wreck from '@hapi/wreck'

const objects = {
  method: 'GET',
  path: '/objects/{path}',
  handler: async (request, h) => {
    const { path } = request.params
    const { payload } = await Wreck.get(`http://fcp-fd-file-retriever:3042/objects/${path}`, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    })

    const file = payload.data.attachment
    return h.response(file).code(200)
  }
}

export default objects
