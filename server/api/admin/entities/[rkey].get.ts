import { getAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return getAdminRecord(event, 'entities', getRouterParam(event, 'rkey'))
})
