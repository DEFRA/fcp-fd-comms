import convict from 'convict'

const api = convict({
  fileRetriever: {
    host: {
      doc: 'Host of the file retriever service (fcp-fd-file-retriever).',
      format: 'url',
      default: 'http://localhost:3042',
      env: 'FILE_RETRIEVER_HOST'
    }
  }
})

api.validate({ allowed: 'strict' })

export default api
