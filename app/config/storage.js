import convict from 'convict'

import isProd from '../utils/is-prod.js'

const storage = convict({
  endpoint: {
    blob: {
      doc: 'Azure Blob Storage Endpoint',
      format: String,
      default: 'https://?.blob.core.windows.net'
    }
  },
  managedIdentityClientId: {
    doc: 'Managed Identity Client ID',
    format: String,
    nullable: !isProd(),
    default: null,
    env: 'MANAGED_IDENTITY_CLIENT_ID'
  },
  clean: {
    accountName: {
      doc: 'Clean Azure Storage Account Name',
      format: String,
      default: null,
      env: 'CLN_STORAGE_ACCOUNT_NAME'
    },
    accessKey: {
      doc: 'Clean Azure Storage Account Access Key - Should only be used in local development',
      format: String,
      nullable: true,
      default: null,
      env: 'CLN_STORAGE_ACCESS_KEY'
    }
  },
  container: {
    objects: {
      doc: 'Azure Blob Storage Object Container',
      format: String,
      default: 'objects',
      env: 'OBJECTS_CONTAINER_NAME'
    }
  }
})

storage.validate({ allowed: 'strict' })

export default storage
