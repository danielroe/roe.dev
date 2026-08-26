import { deleteAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(event => {
  return deleteAdminRecord(event, dev.roe.project.main, getRouterParam(event, 'rkey'))
})
