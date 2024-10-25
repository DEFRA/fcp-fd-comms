import { jest } from '@jest/globals'

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn()
}))

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn()
  }))
}))

const { NotifyClient } = await import('notifications-node-client')
const { farmerApply } = await import('../../../app/messages/farmer-apply.js')

describe('Farmer Apply', () => {
  process.env.NOTIFY_API_KEY = 'mock-notify-api-key'
  process.env.CONFIRM_NEW_USER_NOTIFY_TEMPLATE_ID = 'mock-confirm-new-user-notify-template-id'
  process.env.NOTIFY_TEST_EMAIL = 'mock-email@test.com'

  let mockMessage
  const mockNotifyClientInstance = new NotifyClient(process.env.NOTIFY_API_KEY)

  beforeEach(() => {
    mockMessage = {
      body: {
        data: {
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'http://mock.com/mock-agreement-summary'
          }
        }
      }
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call uuid to create a reference', async () => {
    const { v4: uuidv4 } = await import('uuid')
    await farmerApply(mockMessage) // move to beforeEach block?

    expect(uuidv4).toHaveBeenCalled()
  })

  test('should create a new NotifyClient instance with the current Notify API key', async () => {
    await farmerApply(mockMessage) // move to beforeEach block?

    expect(NotifyClient).toHaveBeenCalledWith('mock-notify-api-key')
  })

  test('should send an email using NotifyClient with correct parameters', async () => {
    await farmerApply(mockMessage) // move to beforeEach block?

    expect(mockNotifyClientInstance.sendEmail).toHaveBeenCalledWith(
      'mock-confirm-new-user-notify-template-id',
      'mock-email@test.com',
      {
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'http://mock.com/mock-agreement-summary'
        },
        reference: 'mock-uuid'
      }
    )
  })
})
