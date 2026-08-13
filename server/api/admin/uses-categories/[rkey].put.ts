import { updateAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.usesCategory.Main, '$type'>>(event)
  return updateAdminRecord(event, dev.roe.usesCategory.main, getRouterParam(event, 'rkey'), body)
})
