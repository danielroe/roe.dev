import { updateAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.project.Main, '$type'>>(event)
  return updateAdminRecord(event, dev.roe.project.main, getRouterParam(event, 'rkey'), body)
})
