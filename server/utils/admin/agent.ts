import type { H3Event } from 'h3'
import { Agent } from '@atproto/api'

import { getAdminSessionCookie, getOauthClient } from './oauth'

/** Restore the admin's OAuth session into an `@atproto/api` Agent. */
export async function requireAdminAgent (event: H3Event): Promise<{ agent: Agent, did: string }> {
  const sess = await getAdminSessionCookie(event)
  const did = sess.data.did
  if (!did) {
    throw createError({ statusCode: 401, statusMessage: 'Not signed in.' })
  }

  const client = getOauthClient(event)
  try {
    const oauthSession = await client.restore(did)
    return { agent: new Agent(oauthSession), did }
  }
  catch (err) {
    console.warn('[admin] OAuth restore failed:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 401, statusMessage: 'Session expired. Please sign in again.' })
  }
}
