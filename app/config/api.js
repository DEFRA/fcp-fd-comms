import convict from 'convict'

const api = convict({
  fileRetriever: {
    url: {
      doc: 'URL of the Single Front Door file retriever service (fcp-fd-file-retriever).',
      format: 'url',
      default: 'http://host.docker.internal:3042',
      env: 'FILE_RETRIEVER_URL'
    }
  }
})

api.validate({ allowed: 'strict' })

export default api
