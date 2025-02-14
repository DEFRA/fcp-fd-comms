import { beforeEach, describe, expect, test, jest } from '@jest/globals'

import { validate } from '../../../../app/schemas/validate.js'
import { v3 } from '../../../../app/schemas/comms-request/index.js'
import environments from '../../../../app/constants/environments.js'

import commsMessage from '../../../mocks/comms-message.js'

describe('comms request schema v3 validation', () => {
  let mockV3Message

  beforeEach(() => {
    mockV3Message = {
      ...commsMessage,
      data: {
        ...commsMessage.data
      }
    }
  })

  test('malformed object should return error', async () => {
    const data = '-----{}'

    const [, error] = await validate(v3, data)

    expect(error).toBeTruthy()
    expect(error).toContainEqual({
      error: 'ValidationError',
      message: '"body" must be of type object'
    })
  })

  test('valid object should return message', async () => {
    const [value, error] = await validate(v3, commsMessage)

    expect(value).toBeTruthy()
    expect(error).toBeNull()
  })

  describe('required / optional fields', () => {
    beforeEach(() => {
      mockV3Message = {
        ...commsMessage,
        data: {
          ...commsMessage.data
        }
      }
    })

    test.each([
      ['id'],
      ['source'],
      ['specversion'],
      ['type'],
      ['datacontenttype'],
      ['time'],
      ['data']
    ])('missing CloudEvent %s should return error', async (field) => {
      delete mockV3Message[field]

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: `"${field}" is required`
      })
    })

    test.each([
      ['sbi'],
      ['notifyTemplateId'],
      ['commsType'],
      ['commsAddresses'],
      ['personalisation'],
      ['reference'],
      ['emailReplyToId']
    ])('missing data %s should return error', async (field) => {
      delete mockV3Message.data[field]

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: `"data.${field}" is required`
      })
    })

    test.each([
      ['crn'],
      ['oneClickUnsubscribeUrl']
    ])('missing optional data %s should return message', async (field) => {
      mockV3Message.data = {
        ...commsMessage.data,
        [field]: undefined
      }

      const [value, error] = await validate(v3, mockV3Message)

      console.log(error)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })
  })

  describe('crn', () => {
    beforeEach(() => {
      mockV3Message.data.crn = '1234567890'
    })

    test.each([
      ['1050000000'],
      ['1092374890'],
      ['9999999999']
    ])('valid crn %s should return message', async (crn) => {
      mockV3Message.data.crn = crn

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })

    test.each([
      ['1049999999', '"data.crn" must be greater than or equal to 1050000000'],
      ['10000000000', '"data.crn" must be less than or equal to 9999999999'],
      ['123456789a', '"data.crn" must be a number'],
      ['asdfghjkl', '"data.crn" must be a number']
    ])('invalid crn %s should return error', async (crn, expectedMessage) => {
      mockV3Message.data.crn = crn

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: expectedMessage
      })
    })
  })

  describe('sbi', () => {
    beforeEach(() => {
      mockV3Message.data.sbi = '1234567890'
    })

    test('missing sbi should return error', async () => {
      delete mockV3Message.data.sbi

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.sbi" is required'
      })
    })

    test.each([
      ['105000000'],
      ['109237489'],
      ['999999999']
    ])('valid sbi %s should return message', async (sbi) => {
      mockV3Message.data.sbi = sbi

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })

    test.each([
      ['104999999', '"data.sbi" must be greater than or equal to 105000000'],
      ['1000000000', '"data.sbi" must be less than or equal to 999999999'],
      ['123456789a', '"data.sbi" must be a number'],
      ['asdfghjkl', '"data.sbi" must be a number']
    ])('invalid sbi %s should return error', async (sbi, expectedMessage) => {
      mockV3Message.data.sbi = sbi

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: expectedMessage
      })
    })
  })

  describe('sourceSystem', () => {
    beforeEach(() => {
      mockV3Message.data.sourceSystem = 'source'
    })

    test('missing sourceSystem should return error', async () => {
      delete mockV3Message.data.sourceSystem

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.sourceSystem" is required'
      })
    })

    test.each([
      ['source'],
      ['source-system'],
      ['source_system'],
      ['source-system-comms']
    ])('valid sourceSystem %s should return message', async (sourceSystem) => {
      mockV3Message.data.sourceSystem = sourceSystem

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })

    test.each([
      ['source.system', '"data.sourceSystem" with value "source.system" fails to match the required pattern: /^[a-z0-9-_]+$/'],
      ['source$system', '"data.sourceSystem" with value "source$system" fails to match the required pattern: /^[a-z0-9-_]+$/'],
      ['sourceSystem', '"data.sourceSystem" with value "sourceSystem" fails to match the required pattern: /^[a-z0-9-_]+$/']
    ])('invalid sourceSystem %s should return error', async (sourceSystem, expectedMessage) => {
      mockV3Message.data.sourceSystem = sourceSystem

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: expectedMessage
      })
    })
  })

  describe('commsAddresses', () => {
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      mockV3Message.data.commsAddresses = 'test@example.com'
      jest.resetModules()
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      jest.resetModules()
    })

    test('missing commsAddresses should return error', async () => {
      delete mockV3Message.data.commsAddresses

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.commsAddresses" is required'
      })
    })

    test('valid email array should return message', async () => {
      mockV3Message.data.commsAddresses = ['test@example.com']

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })

    test('empty commsAddresses array should return error', async () => {
      mockV3Message.data.commsAddresses = []

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.commsAddresses" must contain at least 1 items'
      })
    })

    test('invalid email in array should return error', async () => {
      mockV3Message.data.commsAddresses = ['test@example']

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.commsAddresses[0]" must be a valid email'
      })
    })

    test('valid 10 email in array should return message', async () => {
      mockV3Message.data.commsAddresses = [
        'test1@example.com',
        'test2@example.com',
        'test3@example.com',
        'test4@example.com',
        'test5@example.com',
        'test6@example.com',
        'test7@example.com',
        'test8@example.com',
        'test9@example.com',
        'test10@example.com'
      ]

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })

    test('invalid 11 email in array should return error', async () => {
      mockV3Message.data.commsAddresses = [
        'test1@example.com',
        'test2@example.com',
        'test3@example.com',
        'test4@example.com',
        'test5@example.com',
        'test6@example.com',
        'test7@example.com',
        'test8@example.com',
        'test9@example.com',
        'test10@example.com',
        'test11@example.com'
      ]

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.commsAddresses" must contain less than or equal to 10 items'
      })
    })

    test('valid single email should return message', async () => {
      mockV3Message.data.commsAddresses = 'test@example.com'

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeTruthy()
      expect(error).toBeNull()
    })

    test('invalid single email should return error', async () => {
      mockV3Message.data.commsAddresses = 'test@example'

      const [value, error] = await validate(v3, mockV3Message)

      expect(value).toBeNull()
      expect(error).toBeTruthy()
      expect(error).toContainEqual({
        error: 'ValidationError',
        message: '"data.commsAddresses" must be a valid email'
      })
    })

    describe('environment specific validation', () => {
      const simulatorEmails = [
        'temp-fail@simulator.notify',
        'perm-fail@simulator.notify'
      ]

      const validateWithEnv = async (message, environment) => {
        process.env.NODE_ENV = environment
        jest.resetModules()
        const { v3 } = await import('../../../../app/schemas/comms-request/index.js')
        return validate(v3, message)
      }

      test.each([
        environments.DEVELOPMENT,
        environments.TEST
      ])('should allow simulator emails in %s environment', async (environment) => {
        for (const email of simulatorEmails) {
          mockV3Message.data.commsAddresses = email
          const [value, error] = await validateWithEnv(mockV3Message, environment)
          expect(error).toBeNull()
          expect(value).toBeTruthy()
        }

        mockV3Message.data.commsAddresses = simulatorEmails
        const [value, error] = await validateWithEnv(mockV3Message, environment)
        expect(error).toBeNull()
        expect(value).toBeTruthy()
      })

      test('should reject simulator emails in production environment', async () => {
        for (const email of simulatorEmails) {
          mockV3Message.data.commsAddresses = email
          const [value, error] = await validateWithEnv(mockV3Message, environments.PRODUCTION)
          expect(value).toBeNull()
          expect(error).toBeTruthy()
          expect(error).toContainEqual({
            error: 'ValidationError',
            message: '"data.commsAddresses" must be a valid email'
          })
        }
      })

      test('should allow mixing regular and simulator emails in non-production', async () => {
        const mixedEmails = [
          'test@example.com',
          'temp-fail@simulator.notify',
          'another@example.com',
          'perm-fail@simulator.notify'
        ]

        for (const environment of [environments.DEVELOPMENT, environments.TEST]) {
          mockV3Message.data.commsAddresses = mixedEmails
          const [value, error] = await validateWithEnv(mockV3Message, environment)
          expect(error).toBeNull()
          expect(value).toBeTruthy()
        }
      })

      test('should always allow valid emails regardless of environment', async () => {
        mockV3Message.data.commsAddresses = 'valid@example.com'

        for (const environment of Object.values(environments)) {
          const [value, error] = await validateWithEnv(mockV3Message, environment)
          expect(error).toBeNull()
          expect(value).toBeTruthy()
        }
      })
    })
  })
})
