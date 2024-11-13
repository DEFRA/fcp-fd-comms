import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Sequelize, DataTypes } from 'sequelize'
import { DefaultAzureCredential } from '@azure/identity'

import { databaseConfig } from '../config/index.js'
import isProd from '../utils/is-prod.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const modelPath = path.join(dirname, 'models')

const db = {}

const sequelizeConfig = {
  host: databaseConfig.get('host'),
  port: databaseConfig.get('port'),
  dialect: databaseConfig.get('dialect'),
  dialectOptions: databaseConfig.get('dialectOptions'),
  logging: databaseConfig.get('logging'),
  retry: {
    backoffBase: 500,
    backoffExponent: 1.1,
    match: [/SequelizeConnectionError/],
    max: 10,
    name: 'connection',
    timeout: 60000
  }
}

if (isProd()) {
  sequelizeConfig.hooks = {
    beforeConnect: async (config) => {
      const credential = new DefaultAzureCredential()
      const accessToken = await credential.getToken('https://ossrdbms-aad.database.windows.net')
      config.password = accessToken.token
    }
  }
}

const sequelize = new Sequelize(
  databaseConfig.get('database'),
  databaseConfig.get('username'),
  databaseConfig.get('password'),
  sequelizeConfig
)

const fileExtensionLength = '.js'.length

const files = fs.readdirSync(modelPath)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-fileExtensionLength) === '.js')
  })

for (const file of files) {
  const model = (await import(path.join(modelPath, file))).default(sequelize, DataTypes)
  db[model.name] = model
}

db.sequelize = sequelize
db.Sequelize = Sequelize

export default db
