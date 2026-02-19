import { addServerHandler, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { AtpAgent } from '@atproto/api'

export default defineNuxtModule({
  meta: {
    name: 'standard-site',
  },
  async setup () {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)

    const blueskyHandle = nuxt.options.social ? nuxt.options.social.networks.bluesky?.identifier : null

    addTypeTemplate({
      filename: 'types/standard-site.d.ts',
      getContents: () => `
declare module '#standard-site-did.json' {
  export const standardSiteDid: string | null
}
`,
    }, { nitro: true })

    if (nuxt.options._prepare || nuxt.options.test || !blueskyHandle) {
      if (!nuxt.options._prepare && !nuxt.options.test) {
        console.warn('[standard-site] Bluesky handle not configured. Skipping DID resolution.')
      }
      addTemplate({
        filename: 'standard-site/did.mjs',
        getContents: () => `
/** @type {string | null} */
export const standardSiteDid = null
`,
        write: true,
      })
      return
    }

    // Resolve DID from handle at build time
    let did: string | null = null
    try {
      const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })
      const resolved = await agent.resolveHandle({ handle: blueskyHandle })
      did = resolved.data.did
      console.log(`[standard-site] Resolved DID for ${blueskyHandle}: ${did}`)
    }
    catch (error) {
      console.warn(`[standard-site] Failed to resolve DID for ${blueskyHandle}:`, error)
    }

    // Client template for <link> tags in blog posts
    addTemplate({
      filename: 'standard-site/did.mjs',
      getContents: () => `
/** @type {string | null} */
export const standardSiteDid = ${JSON.stringify(did)}
`,
      write: true,
    })

    // Server virtual module for .well-known route
    nuxt.options.nitro.virtual ||= {}
    nuxt.options.nitro.virtual['#standard-site-did.json'] = () =>
      `export const standardSiteDid = ${JSON.stringify(did)}`

    nuxt.options.nitro.externals ||= {}
    nuxt.options.nitro.externals.inline ||= []
    nuxt.options.nitro.externals.inline.push('#standard-site-did.json')

    // Register .well-known verification route
    addServerHandler({
      route: '/.well-known/site.standard.publication',
      handler: resolver.resolve('./runtime/server/routes/well-known.get'),
    })

    // Prerender the verification route
    nuxt.options.nitro.prerender ||= {}
    nuxt.options.nitro.prerender.routes ||= []
    if (!nuxt.options.nitro.prerender.routes.includes('/.well-known/site.standard.publication')) {
      nuxt.options.nitro.prerender.routes.push('/.well-known/site.standard.publication')
    }
  },
})
