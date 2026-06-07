/**
 * Wire up invitation-link routes from the encrypted `dev.roe.invite`
 * records on the PDS.
 *
 * Each active invite decrypts to a `{ slug, repo }` pair. The slug becomes
 * a public redirect at `/<slug>` that kicks off the GitHub OAuth dance, and
 * the repo lives in `runtimeConfig.invites.map` for the callback handler
 * to read once the OAuth round-trip lands.
 */
import { addServerHandler, createResolver, defineNuxtModule } from 'nuxt/kit'
import { defu } from 'defu'

import { listAllRecords } from '../shared/atproto-read'
import { decryptJSON } from '../../server/utils/admin/encryption'
import type { DevRoeInvite } from '../../shared/lex'

export default defineNuxtModule({
  meta: {
    name: 'invites',
  },
  async setup (_, nuxt) {
    nuxt.options.nitro.typescript = defu(nuxt.options.nitro.typescript, {
      include: ['../modules/runtime/server/**/*'],
    })

    if (nuxt.options._prepare) {
      nuxt.options.runtimeConfig.invites = { map: {} }
      return
    }

    const resolver = createResolver(import.meta.url)
    const gitHubClientId = process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || nuxt.options.runtimeConfig.public.githubClientId

    const map: Record<string, string> = {}

    if (process.env.NUXT_PDS_ENCRYPTION_KEY) {
      try {
        const records = await listAllRecords<DevRoeInvite.Record>('dev.roe.invite')
        for (const r of records) {
          if (!r.value.isActive) continue
          try {
            const { slug, repo } = decryptJSON<{ slug: string, repo: string }>(r.value.encrypted)
            map[slug] = repo
          }
          catch (err) {
            console.warn(`[invites] Failed to decrypt invite ${r.uri}:`, err instanceof Error ? err.message : err)
          }
        }
      }
      catch (err) {
        console.warn('[invites] Failed to list invites from PDS:', err instanceof Error ? err.message : err)
      }
    }
    else {
      console.warn('[invites] NUXT_PDS_ENCRYPTION_KEY not set; invite map will be empty.')
    }

    nuxt.options.runtimeConfig.invites = { map }

    if (!gitHubClientId || Object.keys(map).length === 0) return

    const redirect = nuxt.options.dev
      ? '&redirect_uri=http://localhost:3000/auth/github'
      : '&redirect_uri=https://roe.dev/auth/github'

    nuxt.options.nitro.routeRules ||= {}
    for (const slug in map) {
      nuxt.options.nitro.routeRules['/' + slug] = {
        redirect: `https://github.com/login/oauth/authorize?client_id=${gitHubClientId}${redirect}/${slug}`,
      }
    }

    addServerHandler({
      route: '/auth/github/:slug',
      handler: resolver.resolve('./runtime/server/auth/github/[slug]'),
    })
  },
})
