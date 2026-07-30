import { createAdminRecord } from '../../utils/admin/crud'
import type { DevRoeLocation } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await requireBody<Omit<DevRoeLocation.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.location', body, 'self')
})
