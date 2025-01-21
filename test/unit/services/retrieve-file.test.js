import { jest, test, describe, beforeEach } from '@jest/globals'

global.fetch = jest.fn()

const mockRetrieveFile = jest.fn()

jest.unstable_mockModule('../../../app/services/retrieve-file.js', () => ({
  retrieveFile: mockRetrieveFile
}))

describe('Retrieve File Service', () => {
  let mockPath

  beforeEach(() => {
    jest.clearAllMocks()
    mockPath = '550e8400-e29b-41d4-a716-446655440000'
  })

  test('should convert the retrieved object into a base64 encoded string', async () => {
    const mockBuffer = Buffer.from('Mock file content')

    mockRetrieveFile.mockResolvedValueOnce(mockBuffer.toString('base64'))

    const result = await mockRetrieveFile(mockPath)

    const mockBase64String = mockBuffer.toString('base64')
    expect(result).toEqual(mockBase64String)
  })
})
