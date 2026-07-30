import { updateAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeUsesItem } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await requireBody<Omit<DevRoeUsesItem.Record, '$type'>>(event)
  return updateAdminRecord(event, 'dev.roe.usesItem', getRouterParam(event, 'rkey'), body)
})
