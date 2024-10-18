import { expect, jest } from '@jest/globals'
const configPath = '../../../app/config/database.js'

jest.mock('@azure/identity', () => {
  return {
    DefaultAzureCredential: jest.fn().mockImplementation(() => {
      return {
        getToken: jest.fn().mockResolvedValue({ token: 'mocked-access-token' })
      }
    })
  }
})

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('should set ssl to false when NODE_ENV is "development"', async () => {
    process.env.NODE_ENV = 'development'
    const config = await import(configPath)
    expect(config.default.dialectOptions.ssl).toBe(false)
  })

  test('should set ssl to true when NODE_ENV is "production"', async () => {
    process.env.NODE_ENV = 'production'
    const config = await import(configPath)
    expect(config.default.dialectOptions.ssl).toBe(true)
  })

  test('should not update config.password when NODE_ENV is "production"', async () => {
    process.env.NODE_ENV = 'development'
    const config = await import(configPath)
    await config.default.hooks.beforeConnect(config.default)
    expect(config.default.password).toBeUndefined()
  })

  test('should update config.password when NODE_ENV is "development"', async () => {
    process.env.NODE_ENV = 'production'
    const config = await import(configPath)
    await config.default.hooks.beforeConnect(config.default)
    expect(config.default.password).toBe('mocked-access-token')
  })
})
