import { useRuntimeConfig, defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'cloudflare-vars',
  },
  setup () {
    const nuxt = useNuxt()

    nuxt.hook('nitro:config', config => {
      config.runtimeConfig = useRuntimeConfig()
    })
  },
})
