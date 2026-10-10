import { defineEventHandler, getRouterParam, readBody } from 'nuxt/server'

import { updateAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return updateAdminRecord(event, 'projects', getRouterParam(event, 'rkey'), await readBody(event))
})
