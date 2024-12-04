import { afterAll, describe, expect, jest, test } from '@jest/globals'

import crypto from 'crypto'
import commsMessage from '../../../../mocks/comms-message'
import { publishInvalidRequest } from '../../../../../app/messages/outbound/notification-status/index.js'

const mockSender = jest.fn()

jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn(() => ({
      send: mockSender
    }))
  }
})

const { publishStatus, publishReceived } = await import('../../../../../app/messages/outbound/notification-status/index.js')

describe('Data Layer Outbound Messaging', () => {
  const recipient = 'mock-recipient@example.com'

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
      await publishStatus(commsMessage, recipient, status)

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

  test('should send initial message on service bus', async () => {
    const cryptoSpy = jest.spyOn(crypto, 'randomUUID')

    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    cryptoSpy.mockReturnValue('a41192cf-5478-42ce-846f-64f1cf977535')

    await publishReceived(commsMessage, 'uk.gov.fcp.sfd.notification.received')

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          id: 'a41192cf-5478-42ce-846f-64f1cf977535',
          commsMessage: expect.objectContaining({
            id: 'a41192cf-5478-42ce-846f-64f1cf977535',
            source: 'fcp-fd-comms',
            type: 'uk.gov.fcp.sfd.notification.received',
            time: new Date('2024-11-18T15:00:00.000Z'),
            datacontenttype: 'application/json',
            specversion: '1.0',
            data: {
              ...commsMessage.data,
              correlationId: commsMessage.id
            }
          })
        }),
        source: 'fcp-fd-comms',
        type: 'uk.gov.fcp.sfd.notification.received'
      })
    )

    cryptoSpy.mockRestore()
  })

  test('should include status details in message', async () => {
    const cryptoSpy = jest.spyOn(crypto, 'randomUUID')

    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    cryptoSpy.mockReturnValue('a41192cf-5478-42ce-846f-64f1cf977535')

    await publishStatus(commsMessage, 'mock-email@test.gov.uk', 'delivered')

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          id: 'a41192cf-5478-42ce-846f-64f1cf977535',
          commsMessage: expect.objectContaining({
            id: 'a41192cf-5478-42ce-846f-64f1cf977535',
            source: 'fcp-fd-comms',
            type: 'uk.gov.fcp.sfd.notification.delivered',
            time: new Date('2024-11-18T15:00:00.000Z'),
            datacontenttype: 'application/json',
            specversion: '1.0',
            data: {
              ...commsMessage.data,
              correlationId: commsMessage.id,
              commsAddresses: 'mock-email@test.gov.uk',
              statusDetails: {
                status: 'delivered'
              }
            }
          })
        }),
        source: 'fcp-fd-comms',
        type: 'uk.gov.fcp.sfd.notification.delivered'
      })
    )

    cryptoSpy.mockRestore()
  })

  test('should include error details if passed', async () => {
    const cryptoSpy = jest.spyOn(crypto, 'randomUUID')

    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    cryptoSpy.mockReturnValue('a41192cf-5478-42ce-846f-64f1cf977535')

    const error = {
      status_code: 400,
      errors: [
        {
          error: 'mock-error',
          message: 'mock-error message'
        }
      ]
    }

    await publishStatus(commsMessage, 'mock-email@test.gov.uk', 'internal-failure', error)

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          id: 'a41192cf-5478-42ce-846f-64f1cf977535',
          commsMessage: {
            id: 'a41192cf-5478-42ce-846f-64f1cf977535',
            source: 'fcp-fd-comms',
            type: 'uk.gov.fcp.sfd.notification.failure.internal',
            time: new Date('2024-11-18T15:00:00.000Z'),
            datacontenttype: 'application/json',
            specversion: '1.0',
            data: {
              ...commsMessage.data,
              correlationId: commsMessage.id,
              commsAddresses: 'mock-email@test.gov.uk',
              statusDetails: {
                status: 'internal-failure',
                errorCode: 400,
                errors: [
                  {
                    error: 'mock-error',
                    message: 'mock-error message'
                  }
                ]
              }
            }
          }
        }),
        source: 'fcp-fd-comms',
        type: 'uk.gov.fcp.sfd.notification.failure.internal'
      })
    )

    cryptoSpy.mockRestore()
  })

  test('should send message using original comms message', async () => {
    const cryptoSpy = jest.spyOn(crypto, 'randomUUID')

    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    cryptoSpy.mockReturnValue('a41192cf-5478-42ce-846f-64f1cf977535')

    await publishStatus(commsMessage, 'mock-email@test.gov.uk', 'sending')

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          id: 'a41192cf-5478-42ce-846f-64f1cf977535',
          commsMessage: {
            id: 'a41192cf-5478-42ce-846f-64f1cf977535',
            source: 'fcp-fd-comms',
            type: 'uk.gov.fcp.sfd.notification.sending',
            time: new Date('2024-11-18T15:00:00.000Z'),
            datacontenttype: 'application/json',
            specversion: '1.0',
            data: {
              ...commsMessage.data,
              commsAddresses: 'mock-email@test.gov.uk',
              correlationId: commsMessage.id,
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

  test('should send invalid message with status details', async () => {
    const cryptoSpy = jest.spyOn(crypto, 'randomUUID')

    const mockErrors = [
      {
        type: 'ValidationError',
        message: 'mock-message'
      }
    ]

    jest.setSystemTime(new Date('2024-11-18T15:00:00.000Z'))

    cryptoSpy.mockReturnValue('a41192cf-5478-42ce-846f-64f1cf977535')

    await publishInvalidRequest(commsMessage, mockErrors)

    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          id: 'a41192cf-5478-42ce-846f-64f1cf977535',
          commsMessage: {
            id: 'a41192cf-5478-42ce-846f-64f1cf977535',
            source: 'fcp-fd-comms',
            type: 'uk.gov.fcp.sfd.notification.failure.validation',
            time: new Date('2024-11-18T15:00:00.000Z'),
            datacontenttype: 'application/json',
            specversion: '1.0',
            data: {
              ...commsMessage.data,
              commsAddresses: 'mock-email@test.gov.uk',
              correlationId: commsMessage.id,
              statusDetails: {
                status: 'validation-failure',
                errors: mockErrors
              }
            }
          }
        }),
        source: 'fcp-fd-comms',
        type: 'uk.gov.fcp.sfd.notification.failure.validation'
      })
    )

    cryptoSpy.mockRestore()
  })

  afterAll(() => {
    jest.useRealTimers()
  })
})
