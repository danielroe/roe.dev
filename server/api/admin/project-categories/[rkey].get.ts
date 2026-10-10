import { defineEventHandler, getRouterParam } from 'nuxt/server'

import { getAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return getAdminRecord(event, 'projectCategories', getRouterParam(event, 'rkey'))
})
