import { defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'reduce-chunks',
  },
  setup () {
    const nuxt = useNuxt()
    if (nuxt.options.dev) {
      return
    }
    nuxt.hook('app:resolve', app => {
      app.plugins = app.plugins.filter(p => !p.src.includes('/ws.mjs'))
    })
  },
})
