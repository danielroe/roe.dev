import { defineNuxtModule, useNuxt } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'lazy-css',
  },
  setup () {
    const nuxt = useNuxt()
    nuxt.hook('nitro:init', nitro => {
      nitro.hooks.hook('prerender:generate', route => {
        if (!route.fileName.endsWith('.html')) return

        route.contents = route.contents.replace(
          /<link rel="preload" as="style" href="[^"]*">/g,
          ''
        )
        route.contents = route.contents.replace(
          /<link rel="stylesheet" href="([^"]+)">/g,
          `<link rel="stylesheet" href="$1" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="$1"></noscript>`
        )
      })
    })
  },
})
