import { defu } from 'defu'
import { defineNuxtModule, addServerHandler, createResolver } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'dev-to',
    configKey: 'devTo',
  },
  setup (_options, nuxt) {
    const resolver = createResolver(import.meta.url)
    addServerHandler({
      route: '/_tasks/dev-to',
      handler: resolver.resolve('./dev-to/runtime/routes/_tasks/dev-to'),
    })

    if (nuxt.options.dev) {
      // register task for local use
      nuxt.options.nitro.tasks = defu(nuxt.options.nitro.tasks, {
        'dev-to:sync': {
          handler: resolver.resolve('./dev-to/runtime/tasks/sync'),
        },
      })
      return
    }

    nuxt.options.nitro.prerender = nuxt.options.nitro.prerender || {}
    nuxt.options.nitro.prerender.routes = nuxt.options.nitro.prerender.routes || []
    if (!nuxt.options.nitro.prerender.routes.includes('/_tasks/dev-to')) {
      nuxt.options.nitro.prerender.routes.push('/_tasks/dev-to')
    }

    // Add to prerender routes
    nuxt.hook('nitro:init', nitro => {
      // prerender configuration only
      const nitroConfig = nitro.options._config
      nitroConfig.tasks = defu(nitroConfig.tasks, {
        'dev-to:sync': {
          handler: resolver.resolve('./dev-to/runtime/tasks/sync'),
        },
      })
    })
  },
})
