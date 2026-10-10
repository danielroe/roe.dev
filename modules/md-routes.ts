import { addServerHandler, addServerTemplate, createResolver, defineNuxtModule } from 'nuxt/kit'
import { pageMeta } from './shared/page-meta.ts'

export default defineNuxtModule({
  meta: {
    name: 'md-routes',
  },
  setup (_, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Expose page meta as a virtual module for server routes
    addServerTemplate({
      filename: '#md-page-meta.json',
      getContents: () => `export const pageMeta = ${JSON.stringify(pageMeta)}`,
    })

    // Register blog post .md handlers once we know all the slugs
    nuxt.hook('markdown:blog-entries', entries => {
      for (const entry of entries) {
        addServerHandler({
          route: `${entry.path}.md`,
          handler: resolver.resolve('./md-routes/runtime/server/blog-md.get'),
        })
      }
    })
  },
})
