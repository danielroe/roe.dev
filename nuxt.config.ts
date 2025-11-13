import process from 'node:process'

import { defineNuxtConfig } from 'nuxt/config'
import { extendViteConfig, useNuxt } from 'nuxt/kit'
import { isTest } from 'std-env'
import type { HmrOptions } from 'vite'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/sanity',
    'nuxt-og-image',
    '@nuxt/eslint',
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
      webhookToken: '',
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
      starsToken: '',
    },
    devToToken: '',
    advocuToken: '',
    public: {
      githubClientId: '',
    },
  },

  routeRules: {
    '/api/sponsors': { prerender: true },
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

  experimental: {
    viewTransition: true,
  },

  compatibilityDate: '2025-06-09',

  nitro: {
    experimental: {
      tasks: true,
    },
    replace: {
      'import.meta.test': isTest,
    },
    typescript: {
      tsConfig: {
        compilerOptions: {
          noUncheckedIndexedAccess: true,
        },
      },
    },
    future: { nativeSWR: true },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/live', '/rss.xml', '/voted', '/work', '/feedback', '/ama', '/ai'],
      ignore: ['/__nuxt_content'],
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
        'magic-regexp',
        'partysocket',
      ],
    },
  },

  typescript: {
    nodeTsConfig: {
      include: ['../scripts'],
    },
    hoist: ['vite'],
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
      'www.lambdatest.com',
    ],
    sanity: {
      projectId: '9bj3w2vo',
    },
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

  sanity: {
    apiVersion: '2025-02-19',
    perspective: 'published',
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
        'img-src': ['\'self\'', 'data:', 'https://avatars.githubusercontent.com', 'https://www.google.com', 'https://cdn.sanity.io', 'https://*.gstatic.com'],
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
