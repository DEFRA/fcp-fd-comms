import { jest, test, describe } from '@jest/globals'
import { getObjectById } from '../../../app/api/files.js'

global.fetch = jest.fn()
// const mockGetObjectById = jest.fn()

jest.mock('../../../app/config/index.js', () => ({
  apiConfig: {
    get: jest.fn((key) => {
      if (key === 'fileRetriever.url') {
        return 'http://mock-file-retriever-url.com'
      }
      return null
    })
  }
}))

// jest.unstable_mockModule('../../../app/api/files.js', () => ({
//   getObjectById: mockGetObjectById
// }))

describe('Get Object (Attachment) By ID', () => {
  const baseUrl = 'http://mock-file-retriever-url.com'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch the object (attachment) by ID and return a Buffer', async () => {
    const mockId = '550e8400-e29b-41d4-a716-446655440000'
    const mockArrayBuffer = new ArrayBuffer(8)
    const mockBuffer = Buffer.from(mockArrayBuffer)

    fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValueOnce(mockArrayBuffer)
    })

    const result = await getObjectById(mockId)

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/objects/${mockId}`)
    expect(result).toEqual(mockBuffer)
  })

  test('should throw an error if the response is not ok', async () => {
    const mockId = '550e8400-e29b-41d4-a716-446655440000'

    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    })

    await expect(getObjectById(mockId)).rejects.toThrow('HTTP Error: Not Found')

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/objects/${mockId}`)
  })

  test('should handle fetch errors gracefully', async () => {
    const mockId = '550e8400-e29b-41d4-a716-446655440000'
    const mockError = new Error('Network Error')

    fetch.mockRejectedValueOnce(mockError)

    await expect(getObjectById(mockId)).rejects.toThrow('Network Error')

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/objects/${mockId}`)
  })
})
