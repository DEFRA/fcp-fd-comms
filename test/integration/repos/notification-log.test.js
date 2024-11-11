import { expect, jest, test } from '@jest/globals'

import db from '../../../app/data/index.js'
import {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications
} from '../../../app/repos/notification-log.js'

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

  test('get pending notifications should return all pending notifications', async () => {
    jest.setSystemTime(new Date('2021-01-01T15:00:00.000Z'))

    await db.notifyApiRequestSuccess.create({
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:00:00.000Z'),
      message: { body: 'Hello World!' },
      status: 'created',
      completed: null
    })

    await db.notifyApiRequestSuccess.create({
      notifyResponseId: '21df4efa-c4a8-4007-8f8a-3cf30b652955',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:00:00.000Z'),
      message: { body: 'Hello World!' },
      status: 'sending',
      completed: null
    })

    const result = await getPendingNotifications()

    expect(result).toHaveLength(2)

    expect(result[0]).toEqual({
      id: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      status: 'created'
    })

    expect(result[1]).toEqual({
      id: '21df4efa-c4a8-4007-8f8a-3cf30b652955',
      status: 'sending'
    })
  })

  afterAll(async () => {
    await db.sequelize.close()
    jest.useRealTimers()
  })
})
