import { saveAmaDraft } from '../../../utils/admin/ama-record'
import type { AmaUpdate } from '../../../utils/admin/ama-record'

export default defineEventHandler(async event => {
  const rkey = getRouterParam(event, 'rkey')
  if (!rkey) throw createError({ status: 400, message: 'Missing rkey.' })

  const body = await requireBody<AmaUpdate>(event)
  return saveAmaDraft(event, rkey, body)
})
