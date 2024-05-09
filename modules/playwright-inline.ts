import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import type { InputPluginOption } from 'rollup'

export default defineNuxtModule({
  meta: {
    name: 'playwright-inline',
  },
  setup () {
    // Work around a weird tracing behaviour that traces and includes imports that are not used in production
    const nuxt = useNuxt()
    nuxt.hook('nitro:config', config => {
      (config.rollupConfig!.plugins as InputPluginOption[]).push({
        name: 'purge-the-handler',
        transform (_code, id) {
          if (id.includes('og/[slug]') || id.includes('thumbnail/[slug]')) {
            return 'export default defineEventHandler(() => {})'
          }
        },
      })
    })

    nuxt.hook('nitro:init', nitro => {
      nitro.options._config.rollupConfig!.plugins = (
        nitro.options._config.rollupConfig!.plugins as InputPluginOption[]
      ).filter(p => !p || !('name' in p) || p.name !== 'purge-the-handler')
    })
  },
})
