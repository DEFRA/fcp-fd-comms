import { jest } from '@jest/globals'

const mockNotifyClient = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: mockNotifyClient
}))

describe('Notify client', () => {
  beforeAll(() => {
    jest.clearAllMocks()
    process.env.NOTIFY_API_KEY = 'test'
  })

  test('should create a new Notify client', async () => {
    await import('../../../app/clients/notify-client.js')

    expect(mockNotifyClient).toHaveBeenCalledTimes(1)
    expect(mockNotifyClient).toHaveBeenCalledWith('test')
  })

  afterAll(() => {
    jest.clearAllMocks()
    delete process.env.NOTIFY_API_KEY
  })
})
