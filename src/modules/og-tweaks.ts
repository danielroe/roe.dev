import { defineNuxtModule, useNuxt } from 'nuxt/kit'

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
  },
})
