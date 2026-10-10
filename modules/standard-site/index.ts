/**
 * Serves `/.well-known/site.standard.publication` so an aggregator can
 * discover the at:// URI of this site's "publication" record. The DID is
 * resolved once by the shared `modules/atproto` module and read at runtime
 * from `runtimeConfig.atproto.did`; no resolution happens here.
 */
import { addServerHandler, createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'standard-site',
  },
  setup (_, nuxt) {
    const resolver = createResolver(import.meta.url)

    addServerHandler({
      route: '/.well-known/site.standard.publication',
      handler: resolver.resolve('./runtime/server/routes/well-known.get'),
    })

    nuxt.options.prerender.routes ||= []
    nuxt.options.prerender.routes.push('/.well-known/site.standard.publication')
  },
})
