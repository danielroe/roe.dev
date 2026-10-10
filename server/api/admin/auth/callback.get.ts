import { createError, defineEventHandler, sendRedirect, useRuntimeConfig } from 'nuxt/server'
import { Client } from '@atproto/lex'
import { com } from '@bsky/sdk/lexicons'

import {
  clearAdminSessionCookie,
  getOauth,
  updateAdminSessionCookie,
} from '../../../utils/admin/oauth'

export default defineEventHandler(async event => {
  const expectedHandle = useRuntimeConfig().atproto.handle
  const oauth = await getOauth(event)
  let session
  try {
    ;({ session } = await oauth.callback(event.url.searchParams))
  }
  catch (err) {
    console.error('[admin] OAuth callback failed:', err)
    throw createError({ status: 401, statusText: 'OAuth callback failed.' })
  }

  const { handle } = await new Client(session).call(com.atproto.repo.describeRepo, { repo: session.did })

  if (handle !== expectedHandle) {
    await oauth.revoke(session.did).catch(() => {})
    await clearAdminSessionCookie(event)
    throw createError({
      status: 403,
      statusText: `OAuth session belongs to ${handle}; only ${expectedHandle} can access /admin.`,
    })
  }

  await updateAdminSessionCookie(event, { did: session.did, handle })
  return sendRedirect(event, '/admin', 303)
})
