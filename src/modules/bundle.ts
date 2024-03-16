import { defineNuxtModule } from 'nuxt/kit'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-vite-config',
  },
  setup (options, nuxt) {
    if (process.env.DISABLE_PRERENDER !== 'true') return

    nuxt.options.vite = defu(nuxt.options.vite, {
      $client: {
        build: {
          rollupOptions: {
            output: {
              chunkFileNames: '_nuxt/[name].js',
              entryFileNames: '_nuxt/[name].js'
            }
          }
        }
      }
    })
  },
})
