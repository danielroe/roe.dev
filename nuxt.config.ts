import { defineNuxtConfig } from 'nuxt'
import { addTemplate, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtConfig({
  srcDir: 'src',

  build: {
    transpile: [/content-edge/],
  },

  css: ['~/assets/css/tailwind.css'],

  content: {
    highlight: {
      // preload: ['javascript', 'typescript', 'vue', 'vue-html'],
      theme: 'material-palenight',
    } as any,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    defineNuxtModule({
      setup(_options, nuxt) {
        const { dst } = addTemplate({
          filename: 'legacy-app-stub.mjs',
          getContents: () =>
            `export const legacyPlugin = () => console.log('running legacy plugin')`,
        })
        nuxt.options.alias['./compat/legacy-app.mjs'] = dst
        nuxt.hook('app:templates', app => {
          app.plugins = app.plugins.filter(
            p => !p.src.includes('components.plugin.mjs')
          )
        })
      },
    }),
  ],
})
