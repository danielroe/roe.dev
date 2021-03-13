import type { NuxtConfig } from '@nuxt/types'

export default <NuxtConfig>{
  target: 'static',

  srcDir: 'src',

  head: {
    title: 'roe.dev',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'msapplication-TileColor', content: '#1a202c' },
      { name: 'theme-color', content: '#1a202c' },
      {
        hid: 'og:image',
        property: 'og:image',
        content: `https://roe.dev/og/og.jpg`,
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        name: 'description',
        content: `The personal website of Daniel Roe`,
        hid: 'description',
      },
      {
        property: 'og:description',
        content: `The personal website of Daniel Roe`,
        hid: 'og:description',
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

  components: true,

  buildModules: [
    '@nuxtjs/html-validator',
    '@nuxt/typescript-build',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/composition-api',
  ],

  content: {
    markdown: {
      prism: {
        theme: 'prism-themes/themes/prism-material-dark.css',
      },
    },
  },

  tailwindcss: {
    configPath: '../tailwind.config.js',
    purge: false,
  },

  modern: process.env.NODE_ENV !== 'development',

  build: {
    postcss: {
      plugins: {
        'postcss-nested': {},
      },
    },
  },

  modules: ['@nuxt/content'],
}
