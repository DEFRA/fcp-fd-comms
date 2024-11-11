import { jest } from '@jest/globals'

import db from '../../../app/data/index.js'
import { logCreatedNotification, logRejectedNotification } from '../../../app/repos/notification-log.js'

describe('Notification log repository', () => {
  beforeAll(async () => {
    jest.useFakeTimers('modern')
  })

  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  test('log notfication created should create a new record', async () => {
    const message = { body: 'Hello World!' }
    const notificationId = 'test-notify-response-id'
    jest.setSystemTime(new Date('2021-01-01'))

    await logCreatedNotification(message, notificationId)

    const result = await db.notifyApiRequestSuccess.findAll()
    expect(result).toHaveLength(1)

    const record = result[0]

    expect(record.createdAt).toEqual(new Date('2021-01-01T00:00:00.000Z'))
    expect(record.notifyResponseId).toEqual('test-notify-response-id')
    expect(record.message).toEqual('Hello World!')
    expect(record.status).toEqual('created')
    expect(record.statusUpdatedAt).toEqual(new Date('2021-01-01T00:00:00.000Z'))
    expect(record.completed).toBeNull()
  })

  test('log failed notification should create a new record', async () => {
    const message = { body: 'Hello World!' }
    const error = { response: { data: 'Error message' } }
    jest.setSystemTime(new Date('2021-01-01'))

    await logRejectedNotification(message, error)

    const result = await db.notifyApiRequestFailure.findAll()
    expect(result).toHaveLength(1)

    const record = result[0]

    expect(record.createdAt).toEqual(new Date('2021-01-01T00:00:00.000Z'))
    expect(record.message).toEqual('Hello World!')
    expect(record.error).toEqual('Error message')
  })

  afterAll(async () => {
    await db.sequelize.close()
    jest.useRealTimers()
  })
})
