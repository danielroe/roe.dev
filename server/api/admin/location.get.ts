import { defineEventHandler } from 'nuxt/server'

import { requireAdminAirspace } from '../../utils/airspace'

export default defineEventHandler(async event => {
  return (await requireAdminAirspace(event)).location.get()
})
