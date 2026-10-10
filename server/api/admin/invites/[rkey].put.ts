import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'

import { updateAdminRecord } from '../../../utils/admin/crud'
import { encryptJSON } from '../../../utils/admin/encryption'

interface Body {
  slug: string
  repo: string
  isActive: boolean
  createdAt?: string
}

export default defineEventHandler(async event => {
  const body = await readBody<Body>(event)
  if (!body.slug || !body.repo) {
    throw createError({ status: 422, statusText: 'slug and repo are required.' })
  }
  return updateAdminRecord(event, 'invites', getRouterParam(event, 'rkey'), {
    encrypted: encryptJSON({ slug: body.slug, repo: body.repo }),
    isActive: Boolean(body.isActive),
    ...(body.createdAt ? { createdAt: body.createdAt } : {}),
  })
})
