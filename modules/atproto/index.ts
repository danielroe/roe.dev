/**
 * Resolves the site's atproto identity at build time and surfaces it on
 * `runtimeConfig.atproto.{handle,did}`. The DID and PDS endpoint are also
 * mirrored to `public.atproto.{did,service}` so client code can read them
 * without a round-trip. The handle is sourced from
 * `social.networks.bluesky.identifier`; the PDS endpoint is read from the
 * `#atproto_pds` service entry of the resolved DID document.
 */
import { AtpAgent } from '@atproto/api'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'

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
      if (!cfg.did) {
        const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })
        const { data } = await agent.resolveHandle({ handle })
        cfg.did = data.did
        publicCfg.did = data.did
      }

      if (!publicCfg.service) {
        const endpoint = await resolvePdsEndpoint(cfg.did)
        if (!endpoint) {
          console.warn(`[atproto] DID doc for ${cfg.did} has no #atproto_pds service entry.`)
        }
        else {
          publicCfg.service = endpoint
        }
      }

      console.info(`[atproto] Resolved ${handle} -> ${cfg.did} @ ${publicCfg.service || '(no PDS)'}`)
    }
    catch (err) {
      console.warn(`[atproto] Failed to resolve identity for ${handle}:`, err instanceof Error ? err.message : err)
    }
  },
})
