import { defineEventHandler } from 'nuxt/server'

import { getUses } from '../utils/cms/uses'

export default defineEventHandler(async () => {
  return getUses()
})
