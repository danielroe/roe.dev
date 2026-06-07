import { createAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeUsesItem } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeUsesItem.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.usesItem', body)
})
