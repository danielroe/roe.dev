import { fileURLToPath } from 'url'
import { defineNuxtModule, useNuxt } from '@nuxt/kit'
import { createHead, renderHeadToString } from '@vueuse/head'

export default defineNuxtModule({
  meta: {
    name: 'spa-head',
  },
  setup () {
    const nuxt = useNuxt()
    nuxt.hook('nitro:config', async config => {
      // Add head chunk for SPA renders
      const head = createHead(nuxt.options.app.head)
      const headChunk = await renderHeadToString(head)
      config.virtual!['#spa-head'] = `export default ${JSON.stringify(
        headChunk
      )}`
      config.plugins ||= []
      config.plugins.push(
        fileURLToPath(new URL('./runtime/spa-head-nitro.ts', import.meta.url))
      )
    })
  },
})
