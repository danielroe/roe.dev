export default defineNuxtConfig({
  runtimeConfig: {
    // JWT claims
    privateKey: '',
    publicKey: '',
    // for logging errors
    axiom: {
      dataset: 'roe.dev',
      accessKey: '',
    },
    // emailing ideas
    sendgridApiKey: '',
    github: {
      // my GH ID
      id: 'MDQ6VXNlcjI4NzA2Mzcy',
      // fetching GH repos in build and sponsors when deployed
      token: '',
      // oauth flow
      clientSecret: '',
      inviteToken: '',
    },
    public: {
      githubClientId: '',
    },
  },

  sourcemap: false,

  typescript: { strict: true },

  srcDir: 'src',

  build: {
    transpile: [/content-edge/],
  },

  nitro: {
    vercel: {
      config: {
        images: {
          domains: [],
          sizes: [40, 320, 640, 768, 1024, 1280, 1536, 1536],
        },
      },
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/uses', '/og/og.jpg'],
    },
    hooks: {
      'prerender:generate' (route) {
        if (route.error) {
          process.exit(1)
        }
      },
    },
  },

  content: {
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-palenight',
    },
  },

  app: {
    pageTransition: false,
    layoutTransition: false,
    head: {
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
        ].map(
          href =>
          ({
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
            href,
          } as const)
        ),
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

  image: {
    domains: ['avatars.githubusercontent.com'],
    screens: {
      logo: 40,
      avatar: 70,
    },
  },

  htmlValidator: {
    // failOnError: true,
    options: {
      rules: {
        'wcag/h37': 'warn',
        'element-required-attributes': 'warn',
        'attribute-empty-style': 'off',
      },
    },
  },

  modules: [
    'magic-regexp/nuxt',
    '@nuxt/image-edge',
    '@nuxtjs/html-validator',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    'nuxt-plausible',
    '@nuxtjs/fontaine',
    '~/modules/spa-head',
    '~/modules/tree-shake',
    '~/modules/components-chunk',
    '~/modules/dedupe-hoisted',
    '~/modules/sitemap',
  ],
})
