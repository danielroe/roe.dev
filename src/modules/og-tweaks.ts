import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import type { InputPluginOption } from 'rollup'

export default defineNuxtModule({
  meta: {
    name: 'og-tweaks',
  },
  setup () {
    const nuxt = useNuxt()

    nuxt.hook('modules:done', () => {
      nuxt.hook('components:dirs', dirs => {
        const ogCommunityTemplates = dirs.findIndex(i => typeof i !== 'string' && i.path.includes('components/Templates/Community'))
        if (ogCommunityTemplates !== -1)
          dirs.splice(ogCommunityTemplates, 1)
      })
    })

    // Prevent installing runtime nitro plugin to handle content hooks + SPA site config
    nuxt.hook('modules:done', () => {
      nuxt.options.nitro.plugins = nuxt.options.nitro.plugins?.filter(p => p && !p.includes('runtime/nitro/plugins/nuxt-content') && !p.includes('runtime/nitro/plugins/injectState')) || []
    })

    // Purge OG image endpoints for runtime (as they are fully prerendered)
    nuxt.hook('nitro:config', config => {
      (config.rollupConfig!.plugins as InputPluginOption[]).push({
        name: 'purge-the-handler',
        transform (_code, id) {
          if (id.includes('__og-image__')) {
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
