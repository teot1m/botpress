import { ActivityTypes } from 'botbuilder'
import { getAdapter, getConversationReference } from 'src/utils'
import * as bp from '.botpress'

const DEFAULT_TIMEOUT = 5000

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async ({
  ctx,
  client,
  input,
}) => {
  const { conversationId, timeout } = input
  const expiration = new Date(Date.now() + (timeout ?? DEFAULT_TIMEOUT))
  const adapter = getAdapter(ctx.configuration)
  const convRef = await getConversationReference({ conversationId, client })
  await adapter.continueConversation(convRef, async (turnContext) => {
    await turnContext.sendActivity({
      type: ActivityTypes.Typing,
      expiration,
    })
  })
  return {}
}

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async () => {
  // Deleting the activity is not supported on all bot framework channels
  return {}
}
