import { updateAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeTalk } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await requireBody<Omit<DevRoeTalk.Record, '$type'>>(event)
  return updateAdminRecord(event, 'dev.roe.talk', getRouterParam(event, 'rkey'), body)
})
