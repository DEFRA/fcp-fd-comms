import { expect, jest } from '@jest/globals'

const modelsArray = ['initial.js', 'notifications.js']

jest.mock('sequelize', () => {
  return {
    Sequelize: jest.fn(() => ({
      define: jest.fn().mockImplementation((modelName) => {
        return {
          name: modelName,
          associate: jest.fn()
        }
      })
    })),
    DataTypes: {
      INTEGER: 'INTEGER',
      STRING: 'STRING'
    }
  }
})

jest.mock('fs', () => {
  return {
    readdirSync: jest.fn().mockReturnValue(modelsArray)
  }
})

describe('Data Module Tests', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('should create new sequelize object with environement variables', async () => {
    process.env.POSTGRES_DB = 'my_db_name'
    process.env.POSTGRES_PASSWORD = 'my_db_password'
    process.env.POSTGRES_USERNAME = 'my_db_username'
    const mockSequelize = (await import('sequelize')).Sequelize

    await import('../../../app/data/index.js')

    expect(mockSequelize).toBeCalledWith(process.env.POSTGRES_DB, process.env.POSTGRES_USERNAME, process.env.POSTGRES_PASSWORD, expect.any(Object))
  })

  test('should call mockSequelize once', async () => {
    const mockSequelize = (await import('sequelize')).Sequelize
    await import('../../../app/data/index.js')
    expect(mockSequelize).toBeCalledTimes(1)
  })

  test('should return a value of "initial" for db.sequelize', async () => {
    const dbModule = await import('../../../app/data/index.js')
    const db = dbModule.default
    expect(db.initial).toEqual({ name: 'initial', associate: expect.any(Function) })
  })
})
