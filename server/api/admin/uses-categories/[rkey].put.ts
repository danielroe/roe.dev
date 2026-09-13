import { updateAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return updateAdminRecord(event, 'usesCategories', getRouterParam(event, 'rkey'), await readBody(event))
})
