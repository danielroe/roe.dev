import { createAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return createAdminRecord(event, 'talks', await readBody(event))
})
