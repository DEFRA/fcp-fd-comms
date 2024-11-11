import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Sequelize, DataTypes } from 'sequelize'
import { databaseConfig } from '../config/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const modelPath = path.join(dirname, 'models')

const db = {}

const dbConfig = databaseConfig.getProperties()

const sequelize = new Sequelize(dbConfig)

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
