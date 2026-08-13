import { updateAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.usesItem.Main, '$type'>>(event)
  return updateAdminRecord(event, dev.roe.usesItem.main, getRouterParam(event, 'rkey'), body)
})
