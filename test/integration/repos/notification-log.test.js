import { expect, jest, test } from '@jest/globals'

import db from '../../../app/data/index.js'
import {
  logCreatedNotification,
  logRejectedNotification,
  getPendingNotifications,
  updateNotificationStatus,
  getOriginalNotificationRequest
} from '../../../app/repos/notification-log.js'

import commsMessage from '../../mocks/comms-message.js'

describe('Notification log repository', () => {
  beforeAll(async () => {
    jest.useFakeTimers('modern')
  })

  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  test('log notfication created should create a new record', async () => {
    const notificationId = 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66'
    const recipient = 'mock-email@test.gov.uk'
    jest.setSystemTime(new Date('2021-01-01'))

    await logCreatedNotification(commsMessage, recipient, notificationId)

    const result = await db.notifyApiRequestSuccess.findAll()

    expect(result).toHaveLength(1)

    const record = result[0]

    expect(record).toMatchObject({
      notifyResponseId: notificationId,
      createdAt: new Date('2021-01-01T00:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T00:00:00.000Z'),
      message: commsMessage,
      status: 'created',
      completed: null,
      recipient
    })
  })

  test('log failed notification should create a new record', async () => {
    const error = 'Error message'
    const recipient = 'mock-email@test.gov.uk'
    jest.setSystemTime(new Date('2021-01-01'))

    await logRejectedNotification(commsMessage, recipient, error)

    const result = await db.notifyApiRequestFailure.findAll()
    expect(result).toHaveLength(1)

    const record = result[0]

    expect(record).toMatchObject({
      createdAt: new Date('2021-01-01T00:00:00.000Z'),
      message: commsMessage,
      error: 'Error message',
      recipient
    })
  })

  test('get pending notifications should return all pending notifications', async () => {
    jest.setSystemTime(new Date('2021-01-01T15:00:00.000Z'))

    await db.notifyApiRequestSuccess.create({
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:00:00.000Z'),
      message: commsMessage,
      status: 'created',
      completed: null,
      recipient: 'mock-email-1@test.gov.uk'
    })

    await db.notifyApiRequestSuccess.create({
      notifyResponseId: '21df4efa-c4a8-4007-8f8a-3cf30b652955',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:00:00.000Z'),
      message: commsMessage,
      status: 'sending',
      completed: null,
      recipient: 'mock-email-2@test.gov.uk'
    })

    const result = await getPendingNotifications()

    expect(result).toHaveLength(2)

    expect(result[0]).toEqual({
      id: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      message: commsMessage,
      status: 'created',
      recipient: 'mock-email-1@test.gov.uk'
    })

    expect(result[1]).toEqual({
      id: '21df4efa-c4a8-4007-8f8a-3cf30b652955',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      message: commsMessage,
      status: 'sending',
      recipient: 'mock-email-2@test.gov.uk'
    })
  })

  test('get pending notifications should return empty array when there are no pending notifications', async () => {
    const result = await getPendingNotifications()

    expect(result).toHaveLength(0)
  })

  test('update notification status should update the status of the notification', async () => {
    jest.setSystemTime(new Date('2021-01-01T15:00:00.000Z'))

    await db.notifyApiRequestSuccess.create({
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:00:00.000Z'),
      message: commsMessage,
      status: 'sending',
      completed: null,
      recipient: 'mock-email@test.gov.uk'
    })

    await updateNotificationStatus('e7a60aa3-1677-47eb-9bb9-7405ad4f4a66', 'delivered')

    const result = await db.notifyApiRequestSuccess.findOne({
      where: { notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66' }
    })

    expect(result).toMatchObject({
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T15:00:00.000Z'),
      message: commsMessage,
      status: 'delivered',
      completed: new Date('2021-01-01T15:00:00.000Z'),
      recipient: 'mock-email@test.gov.uk'
    })
  })

  test('update notification status should throw an error when the notification does not exist', async () => {
    const func = updateNotificationStatus('e7a60aa3-1677-47eb-9bb9-7405ad4f4a66', 'delivered')

    await expect(func)
      .rejects
      .toThrow()
  })

  test('get original notification request should return the first appearance of a correlation id', async () => {
    await db.notifyApiRequestSuccess.create({
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:00:00.000Z'),
      message: {
        ...commsMessage,
        id: 'ff2732c9-50c1-4520-90a7-e524da20f08a',
        time: new Date('2021-01-01T14:00:00.000Z').toISOString()
      },
      status: 'temporary-failure',
      completed: null,
      recipient: 'mock-email@test.gov.uk'
    })

    await db.notifyApiRequestSuccess.create({
      notifyResponseId: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:10:00.000Z'),
      statusUpdatedAt: new Date('2021-01-01T14:10:00.000Z'),
      message: {
        ...commsMessage,
        id: '1183ce2f-ab1c-48d0-8903-282986ffc974',
        time: new Date('2021-01-01T14:10:00.000Z').toISOString(),
        data: {
          ...commsMessage.data,
          correlationId: 'ff2732c9-50c1-4520-90a7-e524da20f08a'
        }
      },
      status: 'temporary-failure',
      completed: null,
      recipient: 'mock-email@test.gov.uk'
    })

    const result = await getOriginalNotificationRequest('ff2732c9-50c1-4520-90a7-e524da20f08a')

    expect(result).toEqual({
      id: 'e7a60aa3-1677-47eb-9bb9-7405ad4f4a66',
      createdAt: new Date('2021-01-01T14:00:00.000Z'),
      message: {
        ...commsMessage,
        id: 'ff2732c9-50c1-4520-90a7-e524da20f08a',
        time: new Date('2021-01-01T14:00:00.000Z').toISOString()
      },
      status: 'temporary-failure',
      recipient: 'mock-email@test.gov.uk'
    })
  })

  afterAll(async () => {
    await db.sequelize.close()
    jest.useRealTimers()
  })
})
