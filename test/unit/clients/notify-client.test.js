import { beforeEach, jest, test } from '@jest/globals'

const mockNotifyClient = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: mockNotifyClient
}))

describe('Notify client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.NOTIFY_API_KEY = 'test'

    jest.resetModules()
    jest.clearAllMocks()
  })

  test('should create a new Notify client', async () => {
    await import('../../../app/clients/notify-client.js')

    expect(mockNotifyClient).toHaveBeenCalledTimes(1)
    expect(mockNotifyClient).toHaveBeenCalledWith('test')
  })

  test('should create mock client if useMock is true', async () => {
    process.env.MOCK_SERVER_ENDPOINT = 'http://localhost:8080'
    process.env.USE_MOCK_API_SERVER = true

    await import('../../../app/clients/notify-client.js')

    expect(mockNotifyClient).toHaveBeenCalledTimes(1)
    expect(mockNotifyClient).toHaveBeenCalledWith(
      'http://localhost:8080',
      'test',
      'random-service-id'
    )
  })

  afterAll(() => {
    jest.clearAllMocks()
    process.env = originalEnv
  })
})
