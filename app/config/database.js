import { DefaultAzureCredential } from '@azure/identity'
import environments from '../constants/environments.js'

const isProd = () => {
  return process.env.NODE_ENV === environments.PRODUCTION
}

const hooks = {
  beforeConnect: async (_config) => {
    if (isProd()) {
      const credential = new DefaultAzureCredential()
      const accessToken = await credential.getToken('https://ossrdbms-aad.database.windows.net')
      config.password = accessToken.token
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

const config = {
  database: process.env.POSTGRES_DB || 'fcp_fd_comms',
  dialect: 'postgres',
  dialectOptions: {
    ssl: isProd()
  },
  hooks,
  host: process.env.POSTGRES_HOST || 'fcp-fd-comms-postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  logging: process.env.POSTGRES_LOGGING || false,
  retry,
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  username: process.env.POSTGRES_USERNAME
}

export default config
