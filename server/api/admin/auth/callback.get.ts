import { Client } from '@atproto/lex'
import { com } from '@bsky/sdk/lexicons'

import {
  clearAdminSessionCookie,
  getOauthClient,
  updateAdminSessionCookie,
} from '../../../utils/admin/oauth'

export default defineEventHandler(async event => {
  const expectedHandle = useRuntimeConfig(event).atproto.handle
  const client = getOauthClient(event)
  const params = new URLSearchParams(getQuery(event) as Record<string, string>)

  let session
  try {
    ;({ session } = await client.callback(params))
  }
  catch (err) {
    console.error('[admin] OAuth callback failed:', err)
    throw createError({ statusCode: 401, statusMessage: 'OAuth callback failed.' })
  }

  const { handle } = await new Client(session).call(com.atproto.repo.describeRepo, { repo: session.did })

  if (handle !== expectedHandle) {
    await client.revoke(session.did).catch(() => {})
    await clearAdminSessionCookie(event)
    throw createError({
      statusCode: 403,
      statusMessage: `OAuth session belongs to ${handle}; only ${expectedHandle} can access /admin.`,
    })
  }

  await updateAdminSessionCookie(event, { did: session.did, handle })
  return sendRedirect(event, '/admin', 303)
})
