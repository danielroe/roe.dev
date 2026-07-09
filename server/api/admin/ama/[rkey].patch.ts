import { saveAmaDraft } from '../../../utils/admin/ama-record'
import type { AmaUpdate } from '../../../utils/admin/ama-record'

export default defineEventHandler(async event => {
  const rkey = getRouterParam(event, 'rkey')
  if (!rkey) throw createError({ statusCode: 400, statusMessage: 'Missing rkey.' })

  const body = await readBody<AmaUpdate>(event)
  return saveAmaDraft(event, rkey, body)
})
