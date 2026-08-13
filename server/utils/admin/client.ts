import type { H3Event } from 'h3'
import { Client } from '@atproto/lex'
import type { DidString } from '@atproto/lex'

import { clearAdminSessionCookie, getAdminSessionCookie, getOauthClient } from './oauth'

/** Restore the admin's OAuth session into an `@atproto/lex` Client. */
export async function requireAdminClient (event: H3Event): Promise<{ client: Client, did: DidString }> {
  const sess = await getAdminSessionCookie(event)
  const did = sess.data.did
  if (!did) {
    throw createError({ statusCode: 401, statusMessage: 'Not signed in.' })
  }

  const oauthClient = getOauthClient(event)
  try {
    const oauthSession = await oauthClient.restore(did)
    return { client: new Client(oauthSession), did: oauthSession.did }
  }
  catch (err) {
    console.warn('[admin] OAuth restore failed:', err instanceof Error ? err.message : err)
    await clearAdminSessionCookie(event)
    throw createError({ statusCode: 401, statusMessage: 'Session expired. Please sign in again.' })
  }
}
