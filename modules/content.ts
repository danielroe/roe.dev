import { defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-content-purge',
  },
  setup () {
    const nuxt = useNuxt()
    if (nuxt.options.dev) return
    nuxt.hook('modules:done', () => {
      const purgedHandlers: any[] = []
      nuxt.hook('nitro:init', nitro => {
        for (const handler of nitro.options.handlers!) {
          if (handler?.route && /\/api\/_(content|mdc)/.test(handler.route)) {
            purgedHandlers.push(handler)
          }
        }
        nitro.options.handlers = nitro.options.handlers!.filter(handler => !purgedHandlers.includes(handler))
      })
    })
  },
})
