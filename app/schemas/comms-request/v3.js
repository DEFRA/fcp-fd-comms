import Joi from 'joi'
import { sbi, crn } from '../common/index.js'
import environments from '../../constants/environments.js'

const validateTestEmail = [
  environments.DEVELOPMENT,
  environments.TEST
].includes(process.env.NODE_ENV)
  ? Joi.alternatives().try(
    Joi.string().email(),
    Joi.string().valid('temp-fail@simulator.notify', 'perm-fail@simulator.notify')
  )
  : Joi.string().email()

const v3 = Joi.object({
  id: Joi.string().uuid().required(),
  source: Joi.string().required(),
  specversion: Joi.string().required(),
  type: Joi.string().required(),
  datacontenttype: Joi.string().valid('application/json').required(),
  time: Joi.string().isoDate().required(),
  data: Joi.object({
    crn: crn.optional(),
    sbi: sbi.required(),
    sourceSystem: Joi.string().regex(/^[a-z0-9-_]+$/).required(),
    notifyTemplateId: Joi.string().uuid().required(),
    commsType: Joi.string().valid('email').required(),
    commsAddresses: Joi.alternatives().conditional(Joi.array(), {
      then: Joi.array().items(validateTestEmail).min(1).max(10).required(),
      otherwise: validateTestEmail.required()
    }).required(),
    personalisation: Joi.object().unknown().required(),
    reference: Joi.string().required(),
    oneClickUnsubscribeUrl: Joi.string().uri().optional(),
    emailReplyToId: Joi.string().uuid().required()
  }).required()
}).label('body').required()

export default v3
