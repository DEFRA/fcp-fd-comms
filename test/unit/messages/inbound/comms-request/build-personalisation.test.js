import { jest } from '@jest/globals'

const mockRetrieveFile = jest.fn()

jest.unstable_mockModule('../../../../../app/services/retrieve-file.js', () => ({
  retrieveFile: mockRetrieveFile
}))

const { buildPersonalisation } = await import('../../../../../app/messages/inbound/comms-request/build-personalisation.js')

describe('Build Personalisation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return personalisation as is when there are no attachments', async () => {
    const message = {
      data: {
        personalisation: {
          reference: 'mock-reference',
          agreementSummaryLink: 'https://test.com/mock-agreeement-summary-link'
        }
      }
    }

    const result = await buildPersonalisation(message)

    expect(result).toEqual(message.data.personalisation)
    expect(mockRetrieveFile).not.toHaveBeenCalled()
  })

  test('should add a single attachment to personalisation', async () => {
    mockRetrieveFile.mockResolvedValue('mock-file-name')

    const message = {
      data: {
        personalisation: {
          reference: 'mock-reference'
        },
        attachments: {
          id: 'mock-file-id',
          name: 'mock-file-name'
        }
      }
    }

    const result = await buildPersonalisation(message)

    expect(result).toEqual({
      reference: 'mock-reference',
      'mock-file-name': { file: 'mock-file-name' }
    })
    expect(mockRetrieveFile).toHaveBeenCalledWith('mock-file-id')
  })

  test('should add multiple attachments to personalisation', async () => {
    mockRetrieveFile
      .mockResolvedValueOnce('mock-file-name-1')
      .mockResolvedValueOnce('mock-file-name-2')

    const message = {
      data: {
        personalisation: {
          reference: 'mock-reference'
        },
        attachments: [
          { id: 'mock-file-id-1', name: 'mock-file-name-1' },
          { id: 'mock-file-id-2', name: 'mock-file-name-2' }
        ]
      }
    }

    const result = await buildPersonalisation(message)

    expect(result).toEqual({
      reference: 'mock-reference',
      'mock-file-name-1': { file: 'mock-file-name-1' },
      'mock-file-name-2': { file: 'mock-file-name-2' }
    })
    expect(mockRetrieveFile).toHaveBeenCalledWith('mock-file-id-1')
    expect(mockRetrieveFile).toHaveBeenCalledWith('mock-file-id-2')
  })
})
