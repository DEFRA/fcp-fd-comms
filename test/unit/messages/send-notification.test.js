import { jest } from '@jest/globals'

jest.mock('crypto', () => ({
  randomUUID: jest.fn()
}))

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn()
  }))
}))

const { randomUUID } = await import('crypto')
const { NotifyClient } = await import('notifications-node-client')
const { sendNotification } = await import('../../../app/messages/send-notification.js')

describe('Send Notification', () => {
  let mockMessage

  process.env.NOTIFY_API_KEY = 'mock-notify-api-key'

  beforeEach(() => {
    mockMessage = {
      body: {
        data: {
          commsAddress: 'mock-email@test.com',
          notifyTemplateId: 'mock-notify-template-id',
          personalisation: {
            reference: 'mock-reference',
            agreementSummaryLink: 'https://test.com/mock-agreement-summary'
          },
          reference: 'mock-uuid'
        }
      }
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should create a new NotifyClient instance with the current Notify API key', async () => {
    await sendNotification(mockMessage)
    expect(NotifyClient).toHaveBeenCalledWith('mock-notify-api-key')
  })

  // test('should call randomUUID to create a unique reference', async () => {
  //   await sendNotification(mockMessage)
  //   expect(randomUUID).toHaveBeenCalled()
  // })

  // test('should call sendEmail with correct arguments for a single email address', async () => {
  //   const notifyClientInstance = new NotifyClient(process.env.NOTIFY_API_KEY)
  //   notifyClientInstance.sendEmail = jest.fn()

  //   mockMessage.body.data.commsAddress = 'mock-email-1@test.com'

  //   await sendNotification(mockMessage)

  //   expect(notifyClientInstance.sendEmail).toHaveBeenCalledWith(
  //     mockMessage.body.data.notifyTemplateId,
  //     'mock-email-1@test.com',
  //     {
  //       personalisation: mockMessage.body.data.personalisation,
  //       reference: 'mock-uuid'
  //     }
  //   )
  // })

  // test('should handle multiple email addresses in commsAddress', async () => {
  //   const notifyClientInstance = new NotifyClient(process.env.NOTIFY_API_KEY)
  //   notifyClientInstance.sendEmail = jest.fn()

  //   mockMessage.body.data.commsAddress = ['mock-email-1@test.com', 'mock-email-2@example.com']

  //   await sendNotification(mockMessage)

  //   expect(notifyClientInstance.sendEmail).toHaveBeenCalledTimes(2)
  // })

  // test('should log an error if sendEmail throws', async () => {
  //   const errorMessage = 'Error sending email'
  //   const notifyClientInstance = new NotifyClient(process.env.NOTIFY_API_KEY)
  //   notifyClientInstance.sendEmail.mockRejectedValueOnce(new Error(errorMessage))
  //   console.log = jest.fn()

  //   await sendNotification(mockMessage)

  //   expect(console.log).toHaveBeenCalledWith('Error sending email: ', new Error(errorMessage))
  // })
})
