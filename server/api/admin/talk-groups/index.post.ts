import { createAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeTalkGroup } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeTalkGroup.Record, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, 'dev.roe.talkGroup', body)
})
