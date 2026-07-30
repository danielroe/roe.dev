import { updateAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeUsesCategory } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await requireBody<Omit<DevRoeUsesCategory.Record, '$type'>>(event)
  return updateAdminRecord(event, 'dev.roe.usesCategory', getRouterParam(event, 'rkey'), body)
})
