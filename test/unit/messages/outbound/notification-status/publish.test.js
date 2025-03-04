import { afterAll, describe, expect, jest, test } from '@jest/globals'

import commsMessage from '../../../../mocks/comms-message.js'

const mockSender = jest.fn()

jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn(() => ({
      enrichMessage: jest.requireActual('ffc-messaging').MessageSender.prototype.enrichMessage,
      scheduleMessage: mockSender
    }))
  }
})

const { publishRetryRequest } = await import('../../../../../app/messages/outbound/notification-retry/publish.js')

describe('Data Layer Outbound Messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  test('should send retry request with correct delay', async () => {
    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    await publishRetryRequest(commsMessage, 'test@example.com', 300000)

    expect(mockSender).toHaveBeenCalledWith(
      expect.any(Object),
      new Date('2024-11-18T15:05:00.000Z')
    )
  })

  test('should send message with correlationId set to message id if not provided', async () => {
    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    await publishRetryRequest(commsMessage, 'test@example.com', 300000)

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          data: expect.objectContaining({
            correlationId: commsMessage.id
          })
        })
      }),
      expect.any(Date)
    )
  })

  test('should send message with correlationId set to provided value', async () => {
    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    const message = {
      ...commsMessage,
      data: {
        ...commsMessage.data,
        correlationId: '6ac51d8a-3488-4a17-ba35-b42381646317'
      }
    }

    await publishRetryRequest(message, 'test@example.com', 300000)

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          data: expect.objectContaining({
            correlationId: '6ac51d8a-3488-4a17-ba35-b42381646317'
          })
        })
      }),
      expect.any(Date)
    )
  })

  afterAll(() => {
    jest.useRealTimers()
  })
})
