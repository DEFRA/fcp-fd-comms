import convict from 'convict'
import isProd from '../utils/is-prod.js'

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
  host: {
    doc: 'Host of PostgreSQL database.',
    format: String,
    default: 'fcp-fd-comms-postgres',
    env: 'POSTGRES_HOST'
  },
  password: {
    doc: 'Password for PostgreSQL database.',
    format: String,
    nullable: isProd(),
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
