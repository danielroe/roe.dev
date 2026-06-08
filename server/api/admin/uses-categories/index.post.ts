import { createAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeUsesCategory } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeUsesCategory.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.usesCategory', body)
})
