import Joi from 'joi'

const schema = Joi.object({
  id: Joi.string().required(),
  source: Joi.string().required(),
  specversion: Joi.string().required(),
  type: Joi.string().required(),
  datacontenttype: Joi.string().valid('application/json').required(),
  time: Joi.string().isoDate().required(),
  data: Joi.object({
    crn: Joi.number().min(1050000000).max(9999999999).optional(),
    sbi: Joi.number().min(105000000).max(999999999).required(),
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

const validate = async (message) => {
  try {
    const value = await schema.validateAsync(message, { abortEarly: false })

    return [value, null]
  } catch (error) {
    const errors = error.details.map((d) => ({
      type: 'ValidationError',
      message: d.message
    }))

    return [null, errors]
  }
}

export {
  validate,
  schema
}
