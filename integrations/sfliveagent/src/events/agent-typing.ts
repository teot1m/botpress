import { Conversation } from '@botpress/client'
import * as bp from '.botpress'

export const executeAgentTyping = async ({
  botpressConversationId,
  client,
}: {
  botpressConversationId: string
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentTyping',
    payload: {
      botpressConversationId
    },
  })
}
