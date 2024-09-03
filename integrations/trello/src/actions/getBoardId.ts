import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getBoardIdInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getBoardId: bp.IntegrationProps['actions']['getBoardId'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardName } = getBoardIdInputSchema.parse(input)

  const matchingBoards = await boardQueryService.getBoardsByName(boardName)
  return { boards: matchingBoards }
}

export default wrapWithTryCatch(getBoardId, 'Failed to retrieve the board ID')
