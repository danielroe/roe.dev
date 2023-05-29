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
    resendApiKey: '',
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

  vite: {
    define: {
      'process.env.prerender': 'false',
    },
  },

  experimental: {
    payloadExtraction: true,
    typedPages: true,
  },

  sourcemap: false,

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        // moduleResolution: 'bundler',
        // resolveJsonModule: false,
      },
    },
  },

  srcDir: 'src',

  build: {
    transpile: [/content-edge/, /image-edge/],
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/uses', '/og/og.jpg', '/rss.xml'],
    },
    hooks: {
      'prerender:generate' (route) {
        if (route.fileName)
          route.fileName = route.fileName.replace(/\.xml\/index.html$/, '.xml')

        if (route.error) {
          process.exit(1)
        }
      },
    },
  },

  routeRules: {
    '/feed.xml': { redirect: '/rss.xml' },
  },

  content: {
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-palenight',
    },
  },

  css: ['~/assets/main.css'],

  app: {
    pageTransition: false,
    layoutTransition: false,
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
    failOnError: true,
    options: {
      rules: {
        'wcag/h37': 'warn',
        'element-permitted-content': 'warn',
        'element-required-attributes': 'warn',
        'attribute-empty-style': 'off',
      },
    },
  },

  modules: [
    'nuxt-vitest',
    'magic-regexp/nuxt',
    '@nuxt/image-edge',
    '@nuxtjs/html-validator',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxtjs/plausible',
    '@nuxtjs/fontaine',
  ],
})
