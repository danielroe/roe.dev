export default {
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
      {
        vmid: 'og:image',
        property: 'og:image',
        content: `https://roe.dev/og/og.jpg`,
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        name: 'description',
        content: `The personal website of Daniel Roe`,
        vmid: 'description',
      },
      {
        property: 'og:description',
        content: `The personal website of Daniel Roe`,
        vmid: 'og:description',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@danielcroe' },
      { name: 'twitter:creator', content: '@danielcroe' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        href:
          'https://fonts.googleapis.com/css?family=Barlow|Fira+Code&display=swap',
        rel: 'stylesheet',
      },
    ],
  },

  components: true,

  buildModules: [
    '@nuxtjs/html-validator',
    '@nuxt/typescript-build',
    // '@nuxtjs/stylelint-module',
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

  build: {
    postcss: {
      plugins: {
        'postcss-nested': {},
      },
    },
  },

  modules: ['@nuxt/content'],
}
