import { afterAll, describe, expect, jest, test } from '@jest/globals'

import crypto from 'crypto'
import commsMessage from '../../../mocks/comms-message'

const mockSender = jest.fn()

jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn(() => ({
      send: mockSender
    }))
  }
})

const { publishStatus } = await import('../../../../app/messages/outbound/notification-status/index.js')

describe('Data Layer Outbound Messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  test.each([
    ['created', 'uk.gov.fcp.sfd.notification.sending'],
    ['sending', 'uk.gov.fcp.sfd.notification.sending'],
    ['delivered', 'uk.gov.fcp.sfd.notification.delivered'],
    ['internal-failure', 'uk.gov.fcp.sfd.notification.failure.internal'],
    ['temporary-failure', 'uk.gov.fcp.sfd.notification.failure.provider'],
    ['permanent-failure', 'uk.gov.fcp.sfd.notification.failure.provider'],
    ['technical-failure', 'uk.gov.fcp.sfd.notification.failure.provider']
  ])(
    'should map notify status \'%s\' to event \'%s\'', async (status, event) => {
      await publishStatus(commsMessage, status)

      expect(mockSender).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            commsMessage: expect.objectContaining({
              type: event
            })
          }),
          type: event
        })
      )
    }
  )

  test('should include status details in message', async () => {
    await publishStatus(commsMessage, 'delivered')

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          commsMessage: expect.objectContaining({
            data: {
              ...commsMessage.data,
              statusDetails: {
                status: 'delivered'
              }
            }
          })
        })
      })
    )
  })

  test('should include error details if passed', async () => {
    const error = {
      data: {
        error: {
          status_code: 400,
          errors: [
            {
              error: 'mock-error'
            }
          ]
        }
      }
    }

    await publishStatus(commsMessage, 'internal-failure', error)

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          commsMessage: expect.objectContaining({
            data: {
              ...commsMessage.data,
              statusDetails: {
                status: 'internal-failure',
                error: error.data
              }
            }
          })
        })
      })
    )
  })

  test('should send message using original comms message', async () => {
    const cryptoSpy = jest.spyOn(crypto, 'randomUUID')

    jest.setSystemTime(new Date('2024-11-18T15:00:00Z'))

    cryptoSpy.mockReturnValue('a41192cf-5478-42ce-846f-64f1cf977535')

    await publishStatus(commsMessage, 'sending')

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          id: 'a41192cf-5478-42ce-846f-64f1cf977535',
          commsMessage: {
            ...commsMessage,
            source: 'fcp-fd-comms',
            type: 'uk.gov.fcp.sfd.notification.sending',
            time: new Date('2024-11-18T15:00:00Z'),
            data: {
              ...commsMessage.data,
              statusDetails: {
                status: 'sending'
              }
            }
          }
        }),
        source: 'fcp-fd-comms',
        type: 'uk.gov.fcp.sfd.notification.sending'
      })
    )

    cryptoSpy.mockRestore()
  })

  afterAll(() => {
    jest.useRealTimers()
  })
})
