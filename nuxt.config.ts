import process from 'node:process'

import { defineNuxtConfig } from 'nuxt/config'
import { useNuxt } from 'nuxt/kit'
import { isTest } from 'std-env'
import type { HmrOptions } from 'vite'

export default defineNuxtConfig({
  modules: [
    '~~/modules/social',
    '~~/modules/invites',
    '~~/modules/router',
    '@nuxtjs/sanity',
    'nuxt-og-image',
    '@nuxt/eslint',
    'nuxt-time',
    '@nuxt/test-utils/module',
    'magic-regexp/nuxt',
    '@nuxt/image',
    '@nuxtjs/html-validator',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxtjs/plausible',
    '@nuxt/fonts',
    '@nuxt/scripts',
    function (_options, nuxt) {
      // todo: refactor into nuxt
      nuxt.hook('prepare:types', ctx => {
        ctx.tsConfig.include = ctx.tsConfig.include?.filter(i => i !== '..' && i !== '../**/*')
      })
    },
  ],

  // TODO: remove when Nuxt v3.14 is released
  $development: {
    modules: [
      function (_options, nuxt) {
        if (process.env.IDX_CHANNEL) {
          nuxt.hook('modules:done', () => {
            nuxt.options.vite.server ||= {}
            nuxt.options.vite.server.hmr ||= {}
            ;(nuxt.options.vite.server.hmr as HmrOptions).protocol = 'wss'
          })
        }
      },
    ],
  },

  $production: {
    modules: ['nuxt-security'],
    experimental: {
      noVueServer: true,
    },
    image: {
      provider: 'ipxStatic',
    },
  },

  $test: {
    modules: [
      function (_options, nuxt) {
        nuxt.hook('vite:extendConfig', config => {
          config.plugins = config.plugins?.filter(p => !p || !('name' in p) || p.name !== 'nuxt:scripts:bundler-transformer')
        })
      },
    ],
    experimental: {
      componentIslands: true,
    },
  },

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Daniel Roe',
    },
    pageTransition: false,
    layoutTransition: false,
  },

  css: ['@unocss/reset/tailwind.css', '~/assets/main.css'],

  site: {
    url: 'https://roe.dev',
  },

  content: {
    watch: {
      enabled: false,
    },
    build: {
      markdown: {
        highlight: {
          preload: ['js', 'ts', 'json', 'vue'],
          theme: 'material-theme-palenight',
        },
      },
    },
  },

  runtimeConfig: {
    sanity: {
      token: '',
    },
    cloudflare: {
      s3Url: '',
      r2TokenId: '',
      r2TokenKey: '',
    },
    voteUrl: '',
    sessionPassword: '',
    // emailing ideas
    resendApiKey: '',
    twitch: {
      clientId: '',
      clientSecret: '',
    },
    typefully: {
      apiKey: '',
    },
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

  routeRules: {
    '/api/hi': { cors: true },
    '/feed.xml': { redirect: '/rss.xml' },
    '/thumbnail/**': { cache: { maxAge: 60 * 60 * 24 * 365 } },
    '/chat': { redirect: 'https://roe.dev/blog/open-invitation' },
    '/.well-known/webfinger/**': {
      redirect: {
        to: 'https://mastodon.roe.dev/.well-known/webfinger/**',
        statusCode: 301,
      },
    },
  },

  sourcemap: { client: true, server: false },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    buildCache: false,
    defaults: {
      nuxtLink: {
        trailingSlash: 'append',
      },
      useAsyncData: {
        deep: false,
      },
    },
    cookieStore: true,
    headNext: true,
    viewTransition: true,
    typedPages: true,
  },

  compatibilityDate: '2024-09-19',

  nitro: {
    replace: {
      'import.meta.test': isTest,
    },
    future: { nativeSWR: true },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/rss.xml', '/voted/', '/work/', '/feedback/', '/ama/', '/ai/'],
    },
    hooks: {
      'prerender:generate' (route) {
        if (route.fileName)
          route.fileName = route.fileName.replace(
            /(\.\w{3})\/index.html$/,
            '$1',
          )

        if (route.error) {
          if (route.route.startsWith('/_ipx')) {
            console.warn('Could not prerender', route.route)
            // ignore IPX rendering errors
            delete route.error
          }
          else {
            console.error(route.route, route.error, route)
            process.exit(1)
          }
        }
      },
    },
  },

  vite: {
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
    vue: {
      features: {
        optionsAPI: false,
      },
    },
  },

  typescript: {
    // TODO: remove nitropack/types when nuxt v3.14 is released
    hoist: ['vite', 'nitropack/types'],
  },

  postcss: {
    plugins: {
      'postcss-nesting': {},
      '@unocss/postcss': {},
    },
  },

  hooks: {
    'components:extend' (components) {
      // This code ensures that we can run our markdown renderer on the
      // client side in development mode (for HMR).
      const nuxt = useNuxt()
      for (const comp of components) {
        if (comp.pascalName === 'StaticMarkdownRender' && nuxt.options.dev) {
          comp.mode = 'all'
        }
      }
    },
  },

  devTo: {
    enabled: !!process.env.SYNC_DEV_TO,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  htmlValidator: {
    failOnError: true,
    options: {
      rules: {
        'unrecognized-char-ref': 'off',
        'wcag/h37': 'warn',
        'element-permitted-content': 'warn',
        'element-required-attributes': 'warn',
        'attribute-empty-style': 'off',
      },
    },
  },

  image: {
    domains: [
      'www.dundeescript.co.uk',
      'devoxx.gr',
      'conference.vueschool.io',
      'static-cdn.jtvnw.net',
      'avatars.githubusercontent.com',
      'raw.githubusercontent.com',
      's3.nl-ams.scw.cloud',
      'cdn.bsky.social',
      'cdn.bsky.app',
      'cdn.sanity.io',
      'images.jsworldconference.com',
      'www.middlesbroughfe.co.uk',
      'res.cloudinary.com',
      'cityjsconf.org',
      'vuejsnation.com',
      'vueconf.us',
      'media.graphassets.com',
      'secure.meetupstatic.com',
      'cdn.evbuc.com',
      'conf.vuejs.de',
      'pragvue.com',
      'www.scotlandis.com',
      'conf.vuejs.de',
      'perfnow.nl',
      'www.vuetoronto.com',
      'gdg.community.dev',
    ],
    screens: {
      logo: 40,
      avatar: 70,
      380: 380,
      760: 760,
    },
  },

  ogImage: {
    zeroRuntime: true,
    fonts: [
      'Barlow:400',
      'Barlow:600',
    ],
  },

  plausible: {
    domain: 'roe.dev',
    apiHost: 'https://v.roe.dev',
  },

  security: {
    headers: {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        'script-src-attr': ['\'self\'', '\'unsafe-inline\''],
        'script-src': ['\'self\'', '\'unsafe-inline\'', 'https://static.cloudflareinsights.com'],
        'img-src': ['\'self\'', 'data:', 'https://avatars.githubusercontent.com'],
      },
    },
  },

  social: {
    networks: {
      bluesky: {
        identifier: 'danielroe.dev',
      },
      mastodon: {
        identifier: 'daniel@roe.dev',
      },
    },
  },
})
