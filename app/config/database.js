import convict from 'convict'
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
      database.password = accessToken.token
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

const database = convict({
  database: {
    doc: 'Name of PostgreSQL database.',
    format: String,
    default: 'fcp_fd_comms',
    env: 'POSTGRES_DB'
  },
  dialect: {
    doc: 'Dialect of PostgreSQL database.',
    format: String,
    default: 'postgres'
  },
  dialectOptions: {
    ssl: {
      doc: 'Whether to use SSL for the database connection.',
      format: Boolean,
      default: isProd()
    }
  },
  hooks: {
    doc: 'Hooks to be executed before connecting to the database.',
    format: '*',
    default: hooks
  },
  host: {
    doc: 'Host of PostgreSQL database.',
    format: String,
    default: 'fcp-fd-comms-postgres',
    env: 'POSTGRES_HOST'
  },
  password: {
    doc: 'Password for PostgreSQL database.',
    format: String,
    default: null,
    env: 'POSTGRES_PASSWORD'
  },
  port: {
    doc: 'Port of PostgreSQL database.',
    format: 'port',
    default: 5432,
    env: 'POSTGRES_PORT'
  },
  logging: {
    doc: 'Whether to log SQL queries.',
    format: Boolean,
    default: false,
    env: 'POSTGRES_LOGGING'
  },
  retry: {
    doc: 'Retry options for database connection.',
    format: '*',
    default: retry
  },
  schema: {
    doc: 'Name of PostgreSQL schema.',
    format: String,
    default: 'public',
    env: 'POSTGRES_SCHEMA_NAME'
  },
  username: {
    doc: 'Username for PostgreSQL database.',
    format: String,
    default: null,
    env: 'POSTGRES_USERNAME'
  }
})

database.validate({ allowed: 'strict' })

export default database
