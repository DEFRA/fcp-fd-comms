import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity'

import isProd from '../utils/is-prod.js'

const hooks = {
  beforeConnect: async (config) => {
    if (isProd()) {
      const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
      const tokenProvider = getBearerTokenProvider(
        credential,
        'https://ossrdbms-aad.database.windows.net/.default'
      )
      config.password = tokenProvider
    }
  }
}

const retry = {
  backoffBase: 500,
  backoffExponent: 1.1,
  match: [/SequelizeConnectionError/],
  max: 10,
  name: 'connection',
  timeout: 60000
}

const database = {
  database: process.env.POSTGRES_DB || 'fcp_fd_comms',
  dialect: 'postgres',
  dialectOptions: {
    ssl: isProd()
  },
  hooks,
  host: process.env.POSTGRES_HOST || 'fcp-fd-comms-postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  retry,
  schema: process.env.POSTGRES_SCHEMA || 'public',
  username: process.env.POSTGRES_USERNAME,
  logging: process.env.POSTGRES_LOGGING === 'true'
}

export default database
