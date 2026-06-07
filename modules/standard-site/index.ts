/**
 * Serves `/.well-known/site.standard.publication` so an aggregator can
 * discover the at:// URI of this site's "publication" record. The DID is
 * resolved once by the shared `modules/atproto` module and read at runtime
 * from `runtimeConfig.atproto.did`; no resolution happens here.
 */
import { addServerHandler, createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'standard-site',
  },
  setup () {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)

    addServerHandler({
      route: '/.well-known/site.standard.publication',
      handler: resolver.resolve('./runtime/server/routes/well-known.get'),
    })

    nuxt.options.nitro.prerender ||= {}
    nuxt.options.nitro.prerender.routes ||= []
    if (!nuxt.options.nitro.prerender.routes.includes('/.well-known/site.standard.publication')) {
      nuxt.options.nitro.prerender.routes.push('/.well-known/site.standard.publication')
    }
  },
})
