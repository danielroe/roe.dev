import { defineNuxtModule } from '@nuxt/kit'
import Critters, { Options } from 'critters'

export interface ModuleOptions {
  config?: Options
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'critters',
    configKey: 'critters',
  },
  defaults: {
    // Options passed directly to `critters`
    config: {
      preload: 'media',
    },
  },
  setup(options, nuxt) {
    // Only enable for production
    if (nuxt.options.dev) return

    nuxt.hook('nitro:init', nitro => {
      const critters = new Critters({
        path: nitro.options.output.publicDir,
        publicPath: nuxt.options.app.baseURL,
        ...options.config,
      })
      nitro.hooks.hook('prerender:generate', async route => {
        if (!route.contents || !route.fileName.endsWith('.html')) return
        route.contents = await critters.process(route.contents)
      })
    })
  },
})
