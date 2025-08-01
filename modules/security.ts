import { defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-security-prerender',
  },
  setup () {
    const nuxt = useNuxt()
    nuxt.hook('nitro:init', nitro => {
      const nuxtSecurityPlugins = new Set<string>()
      // remove nuxt-security's plugins from deployed server but keep them when prerendering
      nitro.options.plugins = nitro.options.plugins.filter(plugin => {
        if (plugin.includes('node_modules/nuxt-security/')) {
          nuxtSecurityPlugins.add(plugin)
          return false
        }
        return true
      })
      // remove nuxt-security middleware from deployed server
      nitro.options.handlers = nitro.options.handlers.filter(handler => !handler.handler.includes('node_modules/nuxt-security/'))
      // remove nuxt-security's rate limiter storage (requires lru-cache)
      delete nitro.options.storage['#rate-limiter-storage']
      delete (nitro.options.runtimeConfig as any).security
    })
  },
})
