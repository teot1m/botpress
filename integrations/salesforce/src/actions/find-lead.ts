import type { Implementation } from '../misc/types'

import { findLeadInputSchema } from '../misc/custom-schemas'

import { getClient } from '../utils'

export const findLead: Implementation['actions']['findLead'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = findLeadInputSchema.parse(input)

  const SalesforceClient = getClient(ctx.configuration)

  let response

  try {
    response = await SalesforceClient.findLead(validatedInput.email)
    logger.forBot().info(`Successful - Find Lead - ${response?.Id}`)
  } catch (error) {
    logger.forBot().debug(`'Find Lead' exception ${error}`)
    response = {}
  }

  return { id: response?.Id || '', url: response?.attributes?.url || '' }
}
