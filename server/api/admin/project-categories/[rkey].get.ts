import { getAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(event => {
  return getAdminRecord(event, dev.roe.projectCategory.main, getRouterParam(event, 'rkey'))
})
