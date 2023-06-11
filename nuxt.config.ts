export default defineNuxtConfig({
  $production: {
    experimental: {
      noVueServer: true,
    }
  },
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

  hooks: {
    'vite:extendConfig'(config, { isClient }) {
      if (isClient) {
        config.define!['process.env.prerender'] = 'false'
      }
    }
  },

  experimental: {
    componentIslands: true,
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
      'prerender:generate'(route) {
        if (route.fileName)
          route.fileName = route.fileName.replace(/\.xml\/index.html$/, '.xml')

        if (route.error) {
          console.error(route.error)
          process.exit(1)
        }
      },
    },
  },

  routeRules: {
    '/feed.xml': { redirect: '/rss.xml' },
  },

  // @ts-expect-error Remove when Nuxt 3.6 is released
  content: {
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-palenight',
    },
  },

  css: ['~/assets/main.css'],

  app: {
    head: {
      title: 'Daniel Roe',
    },
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

  fontMetrics: {
    fonts: [
      {
        fallbackName: 'Barlow fallback',
        family: 'Barlow',
        fallbacks: ['Arial'],
      },
    ],
  },

  modules: [
    'nuxt-time',
    'nuxt-vitest',
    'magic-regexp/nuxt',
    '@nuxt/image',
    '@nuxtjs/html-validator',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxtjs/plausible',
    '@nuxtjs/fontaine',
  ],
})
