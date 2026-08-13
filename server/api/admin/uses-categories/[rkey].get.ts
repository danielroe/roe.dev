import { getAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(event => {
  return getAdminRecord(event, dev.roe.usesCategory.main, getRouterParam(event, 'rkey'))
})
