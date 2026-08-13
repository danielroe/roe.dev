import { updateAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.talkGroup.Main, '$type'>>(event)
  return updateAdminRecord(event, dev.roe.talkGroup.main, getRouterParam(event, 'rkey'), body)
})
