import { updateAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.projectCategory.Main, '$type'>>(event)
  return updateAdminRecord(event, dev.roe.projectCategory.main, getRouterParam(event, 'rkey'), body)
})
