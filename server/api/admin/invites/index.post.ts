import { createAdminRecord } from '../../../utils/admin/crud'
import { encryptJSON } from '../../../utils/admin/encryption'
import { dev } from '#shared/lex'

interface Body {
  slug: string
  repo: string
  isActive: boolean
}

export default defineEventHandler(async event => {
  const body = await readBody<Body>(event)
  if (!body.slug || !body.repo) {
    throw createError({ statusCode: 422, statusMessage: 'slug and repo are required.' })
  }
  return createAdminRecord(event, dev.roe.invite.main, {
    encrypted: encryptJSON({ slug: body.slug, repo: body.repo }),
    isActive: Boolean(body.isActive),
  })
})
