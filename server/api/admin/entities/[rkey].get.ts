import { getAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return getAdminRecord(event, 'dev.roe.entity', getRouterParam(event, 'rkey'))
})
