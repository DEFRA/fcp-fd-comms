import Joi from 'joi'
import environments from '../../constants/environments.js'

const nonProductionEnvironments = [
  environments.DEVELOPMENT,
  environments.TEST
]

const createComponent = () => {
  if (nonProductionEnvironments.includes(process.env.NODE_ENV)) {
    return Joi.alternatives().try(
      Joi.string().email(),
      Joi.string().valid('temp-fail@simulator.notify', 'perm-fail@simulator.notify')
    )
  }
  return Joi.string().email()
}

const commsAddress = createComponent()

export default commsAddress
