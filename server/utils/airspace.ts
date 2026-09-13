import type { H3Event } from 'h3'
import { createAirspace } from 'airspace'
import type { Identity } from 'airspace'
import { timestamps } from 'airspace/plugins/timestamps'

import { collections } from '#shared/collections'

/**
 * Reads against our own PDS need no auth, so the public client is shared by
 * every request and caches its listings. Writes go through
 * `requireAdminAirspace`, which carries the editor's OAuth session.
 */
let publicAirspace: ReturnType<typeof createPublicAirspace> | null = null

/** How long a public listing stays fresh. The site reads far more often than it writes. */
const READ_TTL = 60_000

function identityFrom (event: H3Event) {
  const config = useRuntimeConfig(event)
  const did = config.atproto.did
  const service = config.public.atproto.service
  if (!did || !service) {
    throw createError({
      statusCode: 500,
      statusMessage: 'runtimeConfig.atproto.did / public.atproto.service are not set; the build-time atproto module did not resolve them.',
    })
  }
  return { did, service } as { did: Identity['did'], service: string }
}

function createPublicAirspace (event: H3Event) {
  return createAirspace({
    identity: identityFrom(event),
    collections,
    plugins: [timestamps()],
    cache: { ttl: READ_TTL },
  })
}

/** The read-only client behind every public page and API route. */
export function useAirspace (event: H3Event) {
  return publicAirspace ??= createPublicAirspace(event)
}

/**
 * A client authenticated as the editor. Built per request, because the OAuth
 * session store closes over the event.
 */
export async function requireAdminAirspace (event: H3Event) {
  const session = await requireAdminSession(event)
  return createAirspace({
    identity: identityFrom(event),
    collections,
    plugins: [timestamps()],
    session,
  })
}

/** Drop cached public reads after a write, so the site reflects an edit immediately. */
export function invalidatePublicReads (nsid?: string): void {
  publicAirspace?.invalidate(nsid)
}
