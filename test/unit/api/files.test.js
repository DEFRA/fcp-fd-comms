import { jest } from '@jest/globals'

global.fetch = jest.fn()

describe('Get Object (Attachment) by ID', () => {
  let mockBaseUrl

  beforeAll(async () => {
    const { apiConfig } = await import('../../../app/config/index.js')
    mockBaseUrl = apiConfig.get('fileRetriever.url')
    process.env.FILE_RETRIEVER_URL = mockBaseUrl
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch the object by ID and return a Buffer', async () => {
    const { getObjectById } = await import('../../../app/api/files.js')
    const mockId = '550e8400-e29b-41d4-a716-446655440000'
    const mockArrayBuffer = new ArrayBuffer(8)
    const mockBuffer = Buffer.from(mockArrayBuffer)

    fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValueOnce(mockArrayBuffer)
    })

    const result = await getObjectById(mockId)

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/objects/${mockId}`)
    expect(result).toEqual(mockBuffer)
  })

  test('should throw an error if the response is not ok', async () => {
    const { getObjectById } = await import('../../../app/api/files.js')
    const mockId = '550e8400-e29b-41d4-a716-446655440001'

    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    })

    await expect(getObjectById(mockId)).rejects.toThrow('Error retrieving file 550e8400-e29b-41d4-a716-446655440001: Not Found')

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/objects/${mockId}`)
  })

  test('should handle fetch errors gracefully', async () => {
    const { getObjectById } = await import('../../../app/api/files.js')
    const mockId = '550e8400-e29b-41d4-a716-446655440002'
    const mockError = new Error('Network Error')

    fetch.mockRejectedValueOnce(mockError)

    await expect(getObjectById(mockId)).rejects.toThrow('Network Error')

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/objects/${mockId}`)
  })
})
