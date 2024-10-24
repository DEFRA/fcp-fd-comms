import { jest } from '@jest/globals'
import environments from '../../../app/constants/environments.js'

jest.mock('applicationinsights', () => ({
  setup: jest.fn(),
  start: jest.fn()
}))

describe('Service Bus Configuration', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('should validate configuration correctly in production environment with managed identity', async () => {
    process.env.NODE_ENV = environments.PRODUCTION
    process.env.MESSAGE_HOST = 'mock-prd-message-host'
    process.env.MESSAGE_USER = 'mock-prd-user'
    process.env.MESSAGE_PASSWORD = 'mock-prd-password'
    process.env.COMMS_AZURE_CLIENT_ID = 'mock-prd-client-id'
    process.env.MESSAGES_SUBSCRIPTION_ADDRESS = 'mock-prd-subscription-address'
    process.env.MESSAGES_TOPIC_ADDRESS = 'mock-prd-topic-address'

    const { messageConfig } = await import('../../../app/config/index.js')

    expect(messageConfig).toEqual({
      host: 'mock-prd-message-host',
      username: 'mock-prd-user',
      password: 'mock-prd-password',
      useCredentialChain: true,
      managedIdentityClientId: 'mock-prd-client-id',
      appInsights: expect.any(Object),
      address: 'mock-prd-subscription-address',
      topic: 'mock-prd-topic-address',
      type: 'subscription'
    })
  })

  test('should validate configuration correctly in non-production environment without managed identity', async () => {
    process.env.NODE_ENV = environments.DEVELOPMENT
    process.env.MESSAGE_HOST = 'mock-dev-message-host'
    process.env.MESSAGE_USER = 'mock-dev-user'
    process.env.MESSAGE_PASSWORD = 'mock-dev-password'
    process.env.COMMS_AZURE_CLIENT_ID = 'mock-dev-client-id'
    process.env.MESSAGES_SUBSCRIPTION_ADDRESS = 'mock-dev-subscription-address'
    process.env.MESSAGES_TOPIC_ADDRESS = 'mock-dev-topic-address'

    const { messageConfig } = await import('../../../app/config/index.js')

    console.log(messageConfig)

    expect(messageConfig).toEqual({
      host: 'mock-dev-message-host',
      username: 'mock-dev-user',
      password: 'mock-dev-password',
      useCredentialChain: false,
      managedIdentityClientId: 'mock-dev-client-id',
      appInsights: undefined,
      address: 'mock-dev-subscription-address',
      topic: 'mock-dev-topic-address',
      type: 'subscription'
    })
  })
})


