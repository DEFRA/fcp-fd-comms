import { jest, test, describe, beforeEach } from '@jest/globals'
import crypto from 'crypto'

const mockSendEmail = jest.fn()

jest.unstable_mockModule('../../../../../app/clients/notify-client.js', () => ({
  default: {
    sendEmail: mockSendEmail
  }
}))

const { trySendViaNotify } = await import('../../../../../app/messages/inbound/comms-request/try-send-via-notify.js')

describe('trySendViaNotify', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should send email with correct arguments and return response', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

    const message = {
      data: {
        notifyTemplateId: 'mock-template-id'
      }
    }

    const personalisation = {
      reference: 'mock-reference',
      agreementSummaryLink: 'https://test.com/mock-agreement-summary-link'
    }

    const emailAddress = 'mock-email@test.com'

    const mockResponse = { data: { id: 'mock-notify-response-id' } }
    mockSendEmail.mockResolvedValue(mockResponse)

    const [response, error] = await trySendViaNotify(message, emailAddress, personalisation)

    expect(mockSendEmail).toHaveBeenCalledWith(
      'mock-template-id',
      emailAddress,
      {
        personalisation,
        reference: 'mock-uuid'
      }
    )
    expect(response).toEqual(mockResponse)
    expect(error).toBeNull()

    uuidSpy.mockRestore()
  })

  test('should return error when sendEmail fails', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const message = {
      data: {
        notifyTemplateId: 'mock-template-id'
      }
    }

    const personalisation = {
      reference: 'mock-reference'
    }

    const emailAddress = 'mock-email@test.com'

    const mockError = {
      response: {
        data: {
          status_code: 400
        }
      }
    }

    mockSendEmail.mockRejectedValue(mockError)

    const [response, error] = await trySendViaNotify(message, emailAddress, personalisation)

    expect(mockSendEmail).toHaveBeenCalledWith(
      'mock-template-id',
      emailAddress,
      {
        personalisation,
        reference: 'mock-uuid'
      }
    )
    expect(response).toBeNull()
    expect(error).toEqual(mockError)
    expect(consoleSpy).toHaveBeenCalledWith('Error sending email with code:', 400)

    uuidSpy.mockRestore()
    consoleSpy.mockRestore()
  })
})
