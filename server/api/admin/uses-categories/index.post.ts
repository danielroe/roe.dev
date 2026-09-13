import { createAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return createAdminRecord(event, 'usesCategories', await readBody(event))
})
