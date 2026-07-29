import { createAdminRecord } from '../../../utils/admin/crud'
import { encryptJSON } from '../../../utils/admin/encryption'

interface Body {
  slug: string
  repo: string
  isActive: boolean
}

export default defineEventHandler(async event => {
  const body = await requireBody<Body>(event)
  if (!body.slug || !body.repo) {
    throw createError({ status: 422, message: 'slug and repo are required.' })
  }
  return createAdminRecord(event, 'dev.roe.invite', {
    encrypted: encryptJSON({ slug: body.slug, repo: body.repo }),
    isActive: Boolean(body.isActive),
  })
})
