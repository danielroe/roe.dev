import { createAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeEntity } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeEntity.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.entity', body)
})
