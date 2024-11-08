import { jest } from '@jest/globals'
import { saveToDatabase } from '../../../app/messages/save-to-database.js'
import db from '../../../app/data/index.js'
import notifyStatus from '../../../app/constants/notify-statuses.js'

db.notifyApiRequestSuccess = { create: jest.fn() }
db.notifyApiRequestFailure = { create: jest.fn() }

describe('saveToDatabase', () => {
  const message = { body: 'Mock message body' }
  const response = { data: { id: 'mock-notify-response-id' } }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call notifyApiRequestSuccess.create when response contains an ID', async () => {
    await saveToDatabase(message, response, null)
    expect(db.notifyApiRequestSuccess.create).toHaveBeenCalled()
  })

  test('should set createdAt field when notifyApiRequestSuccess.create is called', async () => {
    await saveToDatabase(message, response, null)
    const successCallArgs = db.notifyApiRequestSuccess.create.mock.calls[0][0]
    expect(successCallArgs.createdAt).toBeInstanceOf(Date)
  })

  test('should set notifyResponseId to response.data.id in notifyApiRequestSuccess.create', async () => {
    await saveToDatabase(message, response, null)
    const successCallArgs = db.notifyApiRequestSuccess.create.mock.calls[0][0]
    expect(successCallArgs.notifyResponseId).toBe(response.data.id)
  })

  test('should set message to message.body in notifyApiRequestSuccess.create', async () => {
    await saveToDatabase(message, response, null)
    const successCallArgs = db.notifyApiRequestSuccess.create.mock.calls[0][0]
    expect(successCallArgs.message).toBe(message.body)
  })

  test('should set status to notifyStatus.CREATED in notifyApiRequestSuccess.create', async () => {
    await saveToDatabase(message, response, null)
    const successCallArgs = db.notifyApiRequestSuccess.create.mock.calls[0][0]
    expect(successCallArgs.status).toBe(notifyStatus.CREATED)
  })

  test('should set statusUpdatedAt to a Date instance in notifyApiRequestSuccess.create', async () => {
    await saveToDatabase(message, response, null)
    const successCallArgs = db.notifyApiRequestSuccess.create.mock.calls[0][0]
    expect(successCallArgs.statusUpdatedAt).toBeInstanceOf(Date)
  })

  test('should set completed to null in notifyApiRequestSuccess.create', async () => {
    await saveToDatabase(message, response, null)
    const successCallArgs = db.notifyApiRequestSuccess.create.mock.calls[0][0]
    expect(successCallArgs.completed).toBeNull()
  })
})
