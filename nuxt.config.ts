import { useNuxt } from 'nuxt/kit'
import type { InputPluginOption } from 'rollup'

export default defineNuxtConfig({
  $production: {
    experimental: {
      noVueServer: true,
    },
  },
  devtools: { enabled: true },
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
    'components:extend'(components) {
      // This code ensures that we can run our markdown renderer on the
      // client side in development mode (for HMR).
      const nuxt = useNuxt()
      for (const comp of components) {
        if (comp.pascalName === 'StaticMarkdownRender' && nuxt.options.dev) {
          comp.mode = 'all'
        }
      }
    },
    // We disable prerendering to speed up the bundle test.
    'prerender:routes'(routes) {
      if (process.env.DISABLE_PRERENDER) {
        routes.routes.clear()
      }
    },
    // TODO: this is a hack that we surely do not need
    'nitro:config'(config) {
      if (process.env.DISABLE_PRERENDER) {
        config.prerender ||= {}
        config.prerender.crawlLinks = false
      }
      ;(config.rollupConfig!.plugins as InputPluginOption[]).push({
        name: 'purge-the-handler',
        transform(_code, id) {
          if (id.includes('og/[slug]') || id.includes('thumbnail/[slug]')) {
            return 'export default defineEventHandler(() => {})'
          }
        },
      })
    },
    'nitro:init'(nitro) {
      nitro.options._config.rollupConfig!.plugins = (
        nitro.options._config.rollupConfig!.plugins as InputPluginOption[]
      ).filter(p => !p || !('name' in p) || p.name !== 'purge-the-handler')
    },
    'vite:extendConfig'(config, { isClient }) {
      if (isClient) {
        config.define!['process.env.prerender'] = 'false'
      }
    },
  },

  experimental: {
    // viewTransition: true,
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
      concurrency: 12,
      crawlLinks: true,
      routes: ['/', '/uses', '/og/og.jpg', '/rss.xml'],
    },
    hooks: {
      'prerender:generate'(route) {
        if (route.fileName)
          route.fileName = route.fileName.replace(
            /(\.\w{3})\/index.html$/,
            '$1'
          )

        if (route.error) {
          console.error(route.route, route.error, route)
          process.exit(1)
        }
      },
    },
  },

  routeRules: {
    '/feed.xml': { redirect: '/rss.xml' },
    '/thumbnail/**': { cache: { maxAge: 60 * 60 * 24 * 365 } },
  },

  content: {
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-palenight',
    },
  },

  css: ['@unocss/reset/tailwind.css', '~/assets/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Daniel Roe',
    },
    pageTransition: false,
    layoutTransition: false,
  },

  plausible: {
    domain: 'roe.dev',
    apiHost: 'https://v.roe.dev',
  },

  postcss: {
    plugins: {
      'postcss-nesting': {},
      '@unocss/postcss': {},
    },
  },

  image: {
    domains: [
      'avatars.githubusercontent.com',
      'https://avatars.githubusercontent.com',
    ],
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
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxtjs/plausible',
    '@nuxtjs/fontaine',
  ],
})
