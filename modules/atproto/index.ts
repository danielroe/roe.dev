/**
 * Resolves the site's atproto identity at build time and surfaces it on
 * `runtimeConfig.atproto.{handle,did}`. The DID and PDS endpoint are also
 * mirrored to `public.atproto.{did,service}` so client code can read them
 * without a round-trip. The handle is sourced from
 * `social.networks.bluesky.identifier`; the PDS endpoint is read from the
 * `#atproto_pds` service entry of the resolved DID document.
 */
import { Client, asStringFormat } from '@atproto/lex'
import { api } from '@bsky/sdk'
import { com } from '@bsky/sdk/lexicons'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'

import { hashKey, withCache } from '../shared/build-cache'

/**
 * Resolving `handle -> did -> PDS` costs two sequential round-trips before any
 * other module can run, and the answer changes approximately never. In dev the
 * cached value is used immediately and refreshed in the background.
 */
const IDENTITY_MAX_AGE = 1000 * 60 * 60 * 24 * 7

interface DidDocument {
  service?: Array<{ id: string, type: string, serviceEndpoint: string }>
}

async function resolvePdsEndpoint (did: string): Promise<string | null> {
  if (!did.startsWith('did:plc:') && !did.startsWith('did:web:')) return null
  const url = did.startsWith('did:plc:')
    ? `https://plc.directory/${did}`
    : `https://${did.slice('did:web:'.length)}/.well-known/did.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  const doc = await res.json() as DidDocument
  const pds = doc.service?.find(s => s.id === '#atproto_pds' || s.id.endsWith('#atproto_pds'))
  return pds?.serviceEndpoint ?? null
}

async function resolveIdentity (handle: string, knownDid?: string) {
  let did = knownDid
  if (!did) {
    const client = new Client(api.app.urlPublic)
    did = (await client.call(com.atproto.identity.resolveHandle, { handle: asStringFormat(handle, 'handle') })).did
  }
  return { did, service: await resolvePdsEndpoint(did) }
}

export default defineNuxtModule({
  meta: { name: 'atproto' },
  async setup () {
    const nuxt = useNuxt()

    const social = nuxt.options.social as { networks?: { bluesky?: { identifier?: string } } } | false | undefined
    const handle = social ? social.networks?.bluesky?.identifier : null
    if (!handle) {
      console.warn('[atproto] No Bluesky handle configured under social.networks.bluesky.identifier; downstream modules will be inert.')
      return
    }

    const cfg = nuxt.options.runtimeConfig.atproto
    const publicCfg = nuxt.options.runtimeConfig.public.atproto
    cfg.handle = handle

    if (nuxt.options._prepare || nuxt.options.test) return
    if (cfg.did && publicCfg.service) return

    try {
      const identity = await withCache({
        namespace: 'atproto-identity',
        key: hashKey(handle, cfg.did),
        maxAge: IDENTITY_MAX_AGE,
        stale: nuxt.options.dev,
        fetch: () => resolveIdentity(handle, cfg.did),
      })

      if (!identity?.did) throw new Error(`could not resolve a DID for ${handle}`)

      cfg.did = identity.did
      publicCfg.did = identity.did
      if (identity.service) {
        publicCfg.service ||= identity.service
      }
      else {
        console.warn(`[atproto] DID doc for ${identity.did} has no #atproto_pds service entry.`)
      }

      console.info(`[atproto] Resolved ${handle} -> ${cfg.did} @ ${publicCfg.service || '(no PDS)'}`)
    }
    catch (err) {
      console.warn(`[atproto] Failed to resolve identity for ${handle}:`, err instanceof Error ? err.message : err)
    }
  },
})
