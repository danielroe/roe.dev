/**
 * Build-time airspace clients, for the Nuxt modules that run before the Nitro
 * runtime exists and so can't use `server/utils/airspace.ts`.
 *
 * Identity comes from `runtimeConfig.atproto`, populated by `modules/atproto`,
 */
import { createAirspace, passwordSession } from 'airspace'
import type { Identity } from 'airspace'
import { useRuntimeConfig } from 'nuxt/kit'

import { collections } from '../../shared/collections.ts'

function identity () {
  const config = useRuntimeConfig()
  const did = config.atproto.did
  const service = config.public.atproto.service
  if (!did || !service) {
    throw new Error(
      'runtimeConfig.atproto.did / public.atproto.service are not set; the build-time atproto module did not resolve them from social.networks.bluesky.identifier.',
    )
  }
  return { did, service } as { did: Identity['did'], service: string }
}

let readOnly: ReturnType<typeof createAirspace<typeof collections>> | null = null

/** Unauthenticated reads against our own PDS. */
export function useBuildAirspace () {
  return readOnly ??= createAirspace({ identity: identity(), collections })
}

/**
 * A client that can write, for the sync providers. Needs
 * `NUXT_ATPROTO_PASSWORD`; the PDS and DID are already resolved.
 */
export async function useBuildAirspaceWithSession () {
  const { handle, password } = useRuntimeConfig().atproto
  const { service } = identity()
  if (!handle || !password) {
    throw new Error(`atproto credentials are not configured (missing ${!handle ? 'social.networks.bluesky.identifier' : 'NUXT_ATPROTO_PASSWORD'}).`)
  }
  return createAirspace({
    identity: identity(),
    collections,
    session: await passwordSession({ service, identifier: handle, password }),
  })
}
