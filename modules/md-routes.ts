import { addServerHandler, createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { pageMeta } from './shared/page-meta'

export default defineNuxtModule({
  meta: {
    name: 'md-routes',
  },
  setup () {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)

    // Expose page meta as a virtual module for server routes
    nuxt.options.nitro.virtual ||= {}
    nuxt.options.nitro.virtual['#md-page-meta.json'] = () =>
      `export const pageMeta = ${JSON.stringify(pageMeta)}`

    const mdPages = [
      '/',
      '/ai',
      '/bio',
      '/talks',
      '/uses',
      '/work',
      '/blog',
    ]

    const mdRoutes = mdPages.map(p => p === '/' ? '/index.md' : `${p}.md`)

    nuxt.options.nitro.prerender ||= {}
    nuxt.options.nitro.prerender.routes ||= []
    nuxt.options.nitro.prerender.routes.push(...mdRoutes)

    // Register blog post .md handlers once we know all the slugs
    nuxt.hook('markdown:blog-entries', entries => {
      for (const entry of entries) {
        const route = `${entry.path}.md`

        addServerHandler({
          route,
          handler: resolver.resolve('./md-routes/runtime/server/blog-md.get'),
        })

        nuxt.options.nitro.prerender!.routes!.push(route)
        mdPages.push(entry.path)
      }

      // Now that all pages are known, expose them for the middleware
      nuxt.options.nitro.virtual!['#md-pages.json'] = () =>
        `export const mdPages = new Set(${JSON.stringify(mdPages)})`
    })

    nuxt.options.nitro.externals ||= {}
    nuxt.options.nitro.externals.inline ||= []
    nuxt.options.nitro.externals.inline.push('#md-page-meta.json', '#md-pages.json')
  },
})
