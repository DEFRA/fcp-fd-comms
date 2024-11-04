import { MessageSender } from "ffc-messaging"
import { messageConfig } from "../../config"

const publishMessageStatus = async (data) => {
  const sender = new MessageSender(
    ...messageConfig.get('messageQueue'),
    ...messageConfig.get('dataLayerTopic')
  )
}

export { publishMessageStatus }