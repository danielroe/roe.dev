import { createAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return createAdminRecord(event, 'projectCategories', await readBody(event))
})
