import { useNuxt } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  srcDir: 'src',

  build: {
    transpile: [/content-edge/],
  },

  css: ['~/assets/css/tailwind.css'],

  content: {
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-palenight',
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'msapplication-TileColor', content: '#1a202c' },
        { name: 'theme-color', content: '#1a202c' },
        {
          property: 'og:image',
          content: `https://roe.dev/og/og.jpg`,
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        {
          name: 'description',
          content: `The personal website of Daniel Roe`,
        },
        {
          property: 'og:description',
          content: `The personal website of Daniel Roe`,
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@danielcroe' },
        { name: 'twitter:creator', content: '@danielcroe' },
      ],
      link: [
        ...[
          '/fonts/barlow-7cHpv4kjgoGqM7E_Ass52Hs.woff2',
          '/fonts/firacode-uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7Ng.woff2',
          '/fonts/barlow-7cHpv4kjgoGqM7E_DMs5.woff2',
        ].map(href => ({ rel: 'prefetch', href })),
        { rel: 'mask-icon', color: '#fff', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/svg', href: '/favicon.svg' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#1a202c' },
      ],
    },
  },

  plausible: {
    domain: 'roe.dev',
  },

  critters: {
    config: {
      inlineFonts: true,
      pruneSource: true,
    },
  },

  modules: [
    'magic-regexp/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    'vue-plausible',
    '~/modules/critters',
    function () {
      const nuxt = useNuxt()
      let dirs: string[]
      nuxt.hook('components:dirs', _dirs => {
        dirs = _dirs.map(d => (typeof d === 'string' ? d : d.path))
      })
      // Exclude non-prose content components
      nuxt.hook('components:extend', components => {
        for (const component of components) {
          if (
            'filePath' in component &&
            component.filePath.includes('@nuxt/content')
          ) {
            if (!component.filePath.includes('/Prose/')) {
              components.splice(components.indexOf(component), 1)
            }
          }
        }
      })
      // Use single components chunk
      nuxt.hook('vite:extendConfig', config => {
        if (Array.isArray(config.build.rollupOptions.output)) return
        config.build.rollupOptions.output.manualChunks = id => {
          if (
            id.includes('@nuxt/content') &&
            dirs.some(dir => id.includes(dir))
          ) {
            return 'components-chunk'
          }
        }
      })
    },
  ],
})
