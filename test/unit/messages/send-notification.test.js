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
const { sendNotification } = await import('../../../app/messages/send-notification.js')

describe('Send Notification', () => {
  let mockMessage
  process.env.NOTIFY_API_KEY = 'mock-notify-api-key'

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
    await sendNotification(mockMessage)

    expect(uuidv4).toHaveBeenCalled()
  })

  test('should create a new NotifyClient instance with the current Notify API key', async () => {
    await sendNotification(mockMessage)

    expect(NotifyClient).toHaveBeenCalledWith('mock-notify-api-key')
  })
})