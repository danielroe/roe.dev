import { defineEventHandler } from 'nuxt/server'

import { listAdminRecords } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return listAdminRecords(event, 'projectCategories')
})
