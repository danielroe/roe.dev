import { defu } from 'defu'
import { defineNuxtModule, createResolver, addServerHandler } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'sync',
    configKey: 'sync',
  },
  setup (_options, nuxt) {
    if (nuxt.options.test) return
    const resolver = createResolver(import.meta.url)

    addServerHandler({
      route: '/_tasks/sync',
      handler: resolver.resolve('./runtime/server/routes/_tasks/sync'),
    })

    if (nuxt.options.dev) {
      // register task for local use
      nuxt.options.nitro.tasks = defu(nuxt.options.nitro.tasks, {
        sync: {
          handler: resolver.resolve('./runtime/server/tasks/sync'),
        },
      })
      return
    }

    nuxt.options.nitro.prerender = nuxt.options.nitro.prerender || {}
    nuxt.options.nitro.prerender.routes = nuxt.options.nitro.prerender.routes || []
    if (!nuxt.options.nitro.prerender.routes.includes('/_tasks/sync')) {
      nuxt.options.nitro.prerender.routes.push('/_tasks/sync')
    }

    // Add to prerender routes
    nuxt.hook('nitro:init', nitro => {
      // prerender configuration only
      const nitroConfig = nitro.options._config
      nitroConfig.tasks = defu(nitroConfig.tasks, {
        sync: {
          handler: resolver.resolve('./runtime/server/tasks/sync'),
        },
      })
    })
  },
})
