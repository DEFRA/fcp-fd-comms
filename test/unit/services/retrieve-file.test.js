import { jest } from '@jest/globals'

global.fetch = jest.fn()

jest.unstable_mockModule('../../../app/api/files.js', () => ({
  getObjectById: jest.fn()
}))

describe('Retrieve File Service', () => {
  let mockPath
  beforeEach(() => {
    jest.clearAllMocks()
    mockPath = '550e8400-e29b-41d4-a716-446655440000'
  })

  test('should retrieve and convert the object into a base64 encoded string', async () => {
    const { getObjectById } = await import('../../../app/api/files.js')
    const { retrieveFile } = await import('../../../app/services/retrieve-file.js')
    const mockBuffer = Buffer.from('Mock file content')

    fetch.mockResolvedValueOnce({
      ok: true,
      statusText: 'OK',
      arrayBuffer: jest.fn().mockResolvedValueOnce(mockBuffer)
    })

    getObjectById.mockResolvedValue(mockBuffer)

    const result = await retrieveFile(mockPath)

    const mockBase64String = mockBuffer.toString('base64')
    expect(result).toEqual(mockBase64String)
  })
})
