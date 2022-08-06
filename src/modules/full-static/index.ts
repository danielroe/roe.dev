import { fileURLToPath } from 'url'
import { addPlugin, defineNuxtModule, useNuxt } from '@nuxt/kit'
import { join } from 'pathe'
import { createRegExp, exactly } from 'magic-regexp'

export default defineNuxtModule({
  meta: {
    name: 'full-static',
  },
  setup() {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    addPlugin({
      src: join(runtimeDir, 'plugin.server.ts'),
      mode: 'server',
    })
    addPlugin({
      src: join(runtimeDir, 'plugin.client.ts'),
      mode: 'client',
    })

    useNuxt().hook('nitro:init', nitro => {
      nitro.hooks.hook('prerender:generate', route => {
        route.fileName = route.fileName.replace(JSON_SUFFIX_RE, '.json')
      })
    })
  },
})

const JSON_SUFFIX_RE = createRegExp(exactly('.json/index.html'))
