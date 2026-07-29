import { updateAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeEntity } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await requireBody<Omit<DevRoeEntity.Record, '$type'>>(event)
  return updateAdminRecord(event, 'dev.roe.entity', getRouterParam(event, 'rkey'), body)
})
