import { addVitePlugin, defineNuxtModule, useNuxt } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'reduce-chunks',
  },
  setup () {
    const nuxt = useNuxt()
    nuxt.hook('app:resolve', app => {
      app.plugins = app.plugins.filter(p => !p.src.includes('/ws.mjs'))
    })
    addVitePlugin({
      name: 'reduce-chunks',
      enforce: 'pre',
      transform (code, id) {
        if (id.includes('nuxt-root.vue'))
          return code.replace(
            `const ErrorComponent = defineAsyncComponent(() => import('#build/error-component.mjs').then(r => r.default || r))`,
            "import ErrorComponent from '#build/error-component.mjs'"
          )
      },
    })
  },
})
