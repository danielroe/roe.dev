/**
 * Resolves the site's atproto identity at build time and surfaces it on
 * `runtimeConfig.atproto.{handle,did}`. The DID is also mirrored to
 * `public.atproto.did` so client code can read it without a round-trip.
 * The handle is sourced from `social.networks.bluesky.identifier`.
 */
import { AtpAgent } from '@atproto/api'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'

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
    cfg.handle = handle

    if (nuxt.options._prepare || nuxt.options.test || cfg.did) return

    try {
      const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })
      const { data } = await agent.resolveHandle({ handle })
      cfg.did = data.did
      nuxt.options.runtimeConfig.public.atproto.did = data.did
      console.info(`[atproto] Resolved DID for ${handle}: ${data.did}`)
    }
    catch (err) {
      console.warn(`[atproto] Failed to resolve DID for ${handle}:`, err instanceof Error ? err.message : err)
    }
  },
})
