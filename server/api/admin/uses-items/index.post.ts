import { defineEventHandler, readBody } from 'nuxt/server'

import { createAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return createAdminRecord(event, 'usesItems', await readBody(event))
})
