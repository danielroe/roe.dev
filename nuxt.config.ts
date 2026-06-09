import process from 'node:process'

import { defineNuxtConfig } from 'nuxt/config'
import { extendViteConfig } from 'nuxt/kit'
import { isTest } from 'std-env'
import type { HmrOptions } from 'vite'

export default defineNuxtConfig({
  modules: [
    'nuxt-og-image',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    'magic-regexp/nuxt',
    '@nuxt/image',
    '@nuxtjs/html-validator',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/mdc',
    '@nuxtjs/plausible',
    '@nuxt/fonts',
    '@nuxt/scripts',
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
    runtimeConfig: {
      admin: {
        baseUrl: 'http://127.0.0.1:3000',
      },
    },
    devServer: {
      host: '127.0.0.1',
    },
  },

  $production: {
    modules: ['nuxt-security'],
    image: {
      provider: 'ipxStatic',
    },
  },

  $test: {
    modules: [
      function () {
        extendViteConfig(config => {
          config.plugins = config.plugins?.filter(p => !p || !('name' in p) || p.name !== 'nuxt:scripts:bundler-transformer')
        })
      },
    ],
    experimental: {
      componentIslands: true,
    },
  },

  imports: {
    polyfills: true,
  },

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
    },
    pageTransition: false,
    layoutTransition: false,
  },

  css: ['@unocss/reset/tailwind.css', '~/assets/main.css'],

  site: {
    url: 'https://roe.dev',
  },

  mdc: {
    highlight: {
      theme: 'material-theme-palenight',
      langs: ['js', 'ts', 'json', 'vue', 'css', 'html', 'bash', 'md', 'mdc', 'yaml'],
      noApiRoute: true,
    },
  },

  runtimeConfig: {
    atproto: {
      password: '',
      did: '',
      handle: '',
    },
    admin: {
      // Public origin used to derive the OAuth `client_id`
      // (`<baseUrl>/oauth-client-metadata.json`) and `redirect_uri`. Vercel
      // preview deployments self-host their own metadata so each preview
      // registers a fresh OAuth client with the IdP rather than pointing
      // back at production.
      baseUrl: process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://roe.dev',
    },
    blobReadWriteToken: '',
    mastodon: {
      accessToken: '',
    },
    linkedin: {
      accessToken: '',
    },
    bluesky: {
      accessToken: '',
    },
    youtube: {
      refreshToken: '',
      clientId: '',
      clientSecret: '',
      amaPlaylistId: 'PLQnM-cL9ttacD7fyv6yrtQxaICAUs-2KJ',
    },
    voteUrl: '',
    sessionPassword: '',
    // Pushover notifications
    pushover: {
      token: '',
      userKey: '',
    },
    // Location API key for secure updates
    locationApiKey: '',
    bigdataApiKey: '',
    twitch: {
      clientId: '',
      clientSecret: '',
    },
    github: {
      // my GH ID
      id: 'MDQ6VXNlcjI4NzA2Mzcy',
      // fetching GH repos in build + sponsors when deployed
      token: '',
      // token used to update GitHub status
      profileToken: '',
      // oauth flow
      clientSecret: '',
      inviteToken: '',
    },
    public: {
      githubClientId: '',
      atproto: {
        did: '',
        service: '',
      },
    },
  },

  routeRules: {
    '/admin/**': { prerender: false },
    '/api/admin/**': { prerender: false },
    '/api/talks': { swr: 1 },
    '/api/upcoming-conferences': { swr: 1 },
    '/api/uses': { swr: 1 },
    '/api/current-location': { swr: 1 },
    '/uses.md': { swr: 1 },
    '/api/sponsors': { prerender: true },
    '/api/hi': { cors: true },
    '/feed.xml': { redirect: '/rss.xml' },
    '/work': { redirect: '/projects' },
    '/thumbnail/**': { cache: { maxAge: 60 * 60 * 24 * 365 } },
    '/blog/a-virtuous-cycle': { redirect: '/blog/virtuous-circle' },
    '/blog/ai-writes-my-code': { redirect: 'https://www.youtube.com/watch?v=Zfs3BJZxKkc' },
    '/chat': { redirect: 'https://roe.dev/blog/open-invitation' },
    '/.well-known/webfinger/**': {
      redirect: {
        to: 'https://mastodon.roe.dev/.well-known/webfinger/**',
        statusCode: 301,
      },
    },
  },

  sourcemap: { client: true, server: false },

  experimental: {
    viewTransition: true,
  },

  compatibilityDate: '2025-06-09',

  nitro: {
    replace: {
      'import.meta.test': isTest,
    },
    typescript: {
      tsConfig: {
        compilerOptions: {
          noUncheckedIndexedAccess: true,
          allowImportingTsExtensions: true,
          noEmit: true,
        },
      },
    },
    future: { nativeSWR: true },
    prerender: {
      crawlLinks: true,
      routes: ['/rss.xml', '/llms.txt', '/llms-full.txt'],
    },
    hooks: {
      'prerender:generate' (route) {
        if (route.fileName && route.route !== '/index.md')
          route.fileName = route.fileName.replace(
            /(\.\w{2,3})\/index.html$/,
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
    css: {
      lightningcss: {},
    },
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
    optimizeDeps: {
      include: [
        '@formkit/drag-and-drop/vue',
        'gsap',
        'magic-regexp',
        'mediabunny',
        'modern-screenshot',
        'partysocket',
      ],
    },
  },

  typescript: {
    // The generated lexicon types in `shared/lex/**` cross-reference each
    // other with `.ts` extensions so that Node’s native type-stripping can
    // resolve them at runtime (`node script.ts`) without a loader. Every
    // tsconfig that transitively includes those files needs to allow that.
    tsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
        noEmit: true,
      },
    },
    nodeTsConfig: {
      include: ['../scripts'],
      compilerOptions: {
        allowImportingTsExtensions: true,
        noEmit: true,
      },
    },
    sharedTsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
        noEmit: true,
      },
    },
  },

  postcss: {
    plugins: {
      'postcss-nesting': {},
      '@unocss/postcss': {},
    },
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
      'npmx.social',
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
      'www.lambdatest.com',
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
  },

  plausible: {
    domain: 'roe.dev',
    apiHost: 'https://v.roe.dev',
  },

  scripts: {
    defaultScriptOptions: {
      bundle: true,
    },
  },

  security: {
    headers: {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        'script-src-attr': ['\'self\'', '\'unsafe-inline\''],
        'script-src': ['\'self\'', '\'unsafe-inline\'', 'https://static.cloudflareinsights.com'],
        'img-src': ['\'self\'', 'data:', 'https://avatars.githubusercontent.com', 'https://www.google.com', 'https://*.gstatic.com', 'https://cdn.bsky.app', 'https://npmx.social'],
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
      linkedin: {
        identifier: 'daniel-roe',
      },
    },
  },
})
