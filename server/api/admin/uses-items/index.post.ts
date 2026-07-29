import { createAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeUsesItem } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await requireBody<Omit<DevRoeUsesItem.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.usesItem', body)
})
