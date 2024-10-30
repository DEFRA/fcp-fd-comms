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
    process.env.MESSAGE_QUEUE_HOST = 'mock-prd-message-host'
    process.env.MESSAGE_QUEUE_USER = 'mock-prd-user'
    process.env.MESSAGE_QUEUE_PASSWORD = 'mock-prd-password'
    process.env.AZURE_CLIENT_ID = 'mock-prd-client-id'
    process.env.MESSAGE_QUEUE_SUFFIX = 'mock-prd-topic-subscription-address'

    const { default: config } = await import('../../../app/config/index.js')

    const messageConfig = config.get('messaging')

    const expectedConfig = {
      sharedConfig: {
        host: 'mock-prd-message-host',
        username: 'mock-prd-user',
        password: 'mock-prd-password',
        useCredentialChain: true,
        managedIdentityClientId: 'mock-prd-client-id',
        appInsights: expect.any(Object)
      },
      receiverSubscription: {
        address: 'mock-prd-topic-subscription-address',
        topic: 'mock-prd-topic-subscription-address',
        type: 'subscription'
      }
    }

    expect(messageConfig).toEqual(expectedConfig)
  })

  test('should validate configuration correctly in non-production environment without managed identity', async () => {
    process.env.NODE_ENV = environments.DEVELOPMENT
    process.env.MESSAGE_QUEUE_HOST = 'mock-dev-message-host'
    process.env.MESSAGE_QUEUE_USER = 'mock-dev-user'
    process.env.MESSAGE_QUEUE_PASSWORD = 'mock-dev-password'
    process.env.AZURE_CLIENT_ID = 'mock-dev-client-id'
    process.env.MESSAGE_QUEUE_SUFFIX = 'mock-dev-topic-subscription-address'

    const { default: config } = await import('../../../app/config/index.js')

    const messageConfig = config.get('messaging')

    const expectedConfig = {
      sharedConfig: {
        host: 'mock-dev-message-host',
        username: 'mock-dev-user',
        password: 'mock-dev-password',
        useCredentialChain: false,
        managedIdentityClientId: 'mock-dev-client-id',
        appInsights: undefined
      },
      receiverSubscription: {
        address: 'mock-dev-topic-subscription-address',
        topic: 'mock-dev-topic-subscription-address',
        type: 'subscription'
      }
    }

    expect(messageConfig).toEqual(expectedConfig)
  })
})
