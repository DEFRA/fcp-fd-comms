import db from '../../../app/data/index.js'

beforeEach(async () => {
  await db.sequelize.truncate({ cascade: true })

  await db.notifyApiRequestSuccess.create({
    createdAt: new Date(),
    notifyResponseId: crypto.randomUUID(),
    message: { text: 'Hello World!' },
    status: 'created',
    statusUpdatedAt: new Date(),
    completed: new Date()
  })
})

afterAll(async () => {
  await db.sequelize.close()
})

describe('Database connection', () => {
  test('should return data from the database', async () => {
    const result = await db.notifyApiRequestSuccess.findAll()
    expect(result).toHaveLength(1)
  })
})
