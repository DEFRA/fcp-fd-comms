import { jest } from '@jest/globals'

const mockGetToken = jest.fn()

jest.mock('@azure/identity', () => {
  return {
    DefaultAzureCredential: jest.fn().mockImplementation(() => {
      return {
        getToken: mockGetToken
      }
    })
  }
})

const { DefaultAzureCredential } = await import('@azure/identity')
const { default: db } = await import('../../../app/data/index.js')

describe('Sequelize hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call getToken if env is production', async () => {
    const originalEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'production'

    mockGetToken.mockResolvedValue('ppp')

    await db.sequelize.authenticate()

    expect(DefaultAzureCredential).toHaveBeenCalled()
    expect(mockGetToken).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  test('should not call getToken if env is not production', async () => {
    const originalEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    mockGetToken.mockResolvedValue('ppp')

    await db.sequelize.authenticate()

    expect(DefaultAzureCredential).not.toHaveBeenCalled()
    expect(mockGetToken).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  afterAll(async () => {
    await db.sequelize.close()
  })
})
