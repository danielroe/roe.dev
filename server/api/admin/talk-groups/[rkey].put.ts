import { updateAdminRecord } from '../../../utils/admin/crud'
import type { DevRoeTalkGroup } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<DevRoeTalkGroup.Record, '$type'>>(event)
  return updateAdminRecord(event, 'dev.roe.talkGroup', getRouterParam(event, 'rkey'), body)
})
