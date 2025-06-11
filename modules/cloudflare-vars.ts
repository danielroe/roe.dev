import { useRuntimeConfig, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { kebabCase } from 'scule'

export default defineNuxtModule({
  meta: {
    name: 'cloudflare-vars',
  },
  setup () {
    const nuxt = useNuxt()

    nuxt.hook('nitro:config', config => {
      const runtimeConfig = useRuntimeConfig()
      const vars: Record<string, string> = {}

      function walkConfig (obj: Record<string, any>, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            walkConfig(value, `${prefix}${key}.`)
          }
          else if (typeof value !== 'object') {
            const varKey = `NUXT_${kebabCase(`${prefix}${key}`)}`.toUpperCase().replace(/-/g, '_')
            vars[varKey] = value
          }
        }
      }

      walkConfig(runtimeConfig)

      config.cloudflare ||= {}
      config.cloudflare.wrangler ||= {}
      config.cloudflare.wrangler.vars = {
        ...vars,
        ...config.cloudflare.wrangler.vars,
      }
    })
  },
})
