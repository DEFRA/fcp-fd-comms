import Joi from 'joi'

import { sbi, crn } from '../common/index.js'

const v3 = Joi.object({
  id: Joi.string().required(),
  source: Joi.string().required(),
  specversion: Joi.string().required(),
  type: Joi.string().required(),
  datacontenttype: Joi.string().valid('application/json').required(),
  time: Joi.string().isoDate().required(),
  data: Joi.object({
    crn: crn.optional(),
    sbi: sbi.required(),
    sourceSystem: Joi.string().required(),
    notifyTemplateId: Joi.string().uuid().required(),
    commsType: Joi.string().valid('email').required(),
    commsAddresses: Joi.alternatives(
      Joi.array().items(Joi.string().email().required()).min(1),
      Joi.string().email().required()
    ),
    personalisation: Joi.object().unknown().required(),
    reference: Joi.string().required(),
    oneClickUnsubscribeUrl: Joi.string().uri().optional(),
    emailReplyToId: Joi.string().uuid().required()
  }).required()
})

export default v3
