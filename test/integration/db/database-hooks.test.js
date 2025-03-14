import { jest } from '@jest/globals'

jest.setTimeout(30000)

const mockGetToken = jest.fn()
const mockGetBearerTokenProvider = jest.fn()

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken
  })),
  getBearerTokenProvider: jest.fn().mockImplementation(() => mockGetBearerTokenProvider)
}))

describe('Sequelize hooks', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('should call getToken if env is production', async () => {
    const originalEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'production'

    const { DefaultAzureCredential, getBearerTokenProvider } = await import('@azure/identity')

    const { databaseConfig } = await import('../../../app/config/index.js')

    const originalSsl = databaseConfig.dialectOptions.ssl

    databaseConfig.dialectOptions.ssl = false

    mockGetToken.mockResolvedValue({
      token: 'ppp'
    })

    mockGetBearerTokenProvider.mockReturnValue('ppp')

    const { default: db } = await import('../../../app/data/index.js')

    await db.sequelize.authenticate()

    expect(DefaultAzureCredential).toHaveBeenCalled()
    expect(getBearerTokenProvider).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
    databaseConfig.dialectOptions.ssl = originalSsl

    await db.sequelize.close()
  })

  test('should not call getToken if env is not production', async () => {
    const originalEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    const { DefaultAzureCredential } = await import('@azure/identity')

    const { default: db } = await import('../../../app/data/index.js')

    await db.sequelize.authenticate()

    expect(DefaultAzureCredential).not.toHaveBeenCalled()
    expect(mockGetToken).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv

    await db.sequelize.close()
  })
})
