import { createAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeTalk } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeTalk.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.talk', body)
})
