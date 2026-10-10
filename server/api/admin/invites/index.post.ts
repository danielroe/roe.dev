import { createError, defineEventHandler, readBody } from 'nuxt/server'

import { createAdminRecord } from '../../../utils/admin/crud'
import { encryptJSON } from '../../../utils/admin/encryption'

interface Body {
  slug: string
  repo: string
  isActive: boolean
}

export default defineEventHandler(async event => {
  const body = await readBody<Body>(event)
  if (!body.slug || !body.repo) {
    throw createError({ status: 422, statusText: 'slug and repo are required.' })
  }
  return createAdminRecord(event, 'invites', {
    encrypted: encryptJSON({ slug: body.slug, repo: body.repo }),
    isActive: Boolean(body.isActive),
  })
})
