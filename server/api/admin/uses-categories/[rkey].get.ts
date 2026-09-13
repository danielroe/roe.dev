import { getAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return getAdminRecord(event, 'usesCategories', getRouterParam(event, 'rkey'))
})
