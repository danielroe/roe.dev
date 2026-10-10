import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'

import { saveAmaDraft } from '../../../utils/admin/ama-record'
import type { AmaUpdate } from '../../../utils/admin/ama-record'

export default defineEventHandler(async event => {
  const rkey = getRouterParam(event, 'rkey')
  if (!rkey) throw createError({ status: 400, statusText: 'Missing rkey.' })

  const body = await readBody<AmaUpdate>(event)
  return saveAmaDraft(event, rkey, body)
})
