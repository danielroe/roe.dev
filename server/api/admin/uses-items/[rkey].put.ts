import { updateAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeUsesItem } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeUsesItem.Record, '$type'>>(event)
  return updateAdminRecord(event, 'dev.roe.usesItem', getRouterParam(event, 'rkey'), body)
})
