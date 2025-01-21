import { jest, test, describe, beforeEach } from '@jest/globals'
import { retrieveFile } from '../../../app/services/retrieve-file.js'

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

  test('should convert the object (attachment) retrieved into a base64 encoded string', async () => {
    const mockBuffer = Buffer.from('Mock file content')

    fetch.mockResolvedValueOnce({
      ok: true,
      statusText: 'OK',
      arrayBuffer: jest.fn().mockResolvedValueOnce(mockBuffer)
    })

    const { getObjectById } = await import('../../../app/api/files.js')
    getObjectById.mockResolvedValue(mockBuffer)

    const result = await retrieveFile(mockPath)

    const mockBase64String = mockBuffer.toString('base64')
    expect(result).toEqual(mockBase64String)
  })
})
