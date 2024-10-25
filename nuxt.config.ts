import process from 'node:process'
import { useNuxt } from 'nuxt/kit'
import { isTest } from 'std-env'
import type { HmrOptions } from 'vite'

export default defineNuxtConfig({
  modules: [
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
      nuxt.hook('vite:extendConfig', config => {
        const deps = ['slugify', 'remark-gfm', 'remark-emoji', 'remark-mdc', 'remark-rehype', 'rehype-raw', 'parse5', 'unist-util-visit', 'unified', 'debug']
        config.optimizeDeps!.include = config.optimizeDeps!.include?.map(d => deps.includes(d) ? `@nuxt/content > ${d}` : d)
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
    watch: false,
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-theme-palenight',
    },
  },

  runtimeConfig: {
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
    '/.well-known/webfinger/**': {
      redirect: {
        to: 'https://mastodon.roe.dev/.well-known/webfinger/**',
        statusCode: 301,
      },
    },
    '/api/hi': { cors: true },
    '/feed.xml': { redirect: '/rss.xml' },
    '/thumbnail/**': { cache: { maxAge: 60 * 60 * 24 * 365 } },
    '/chat': { redirect: 'https://roe.dev/blog/open-invitation' },
  },

  sourcemap: false,

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    buildCache: true,
    defaults: {
      useAsyncData: {
        deep: false,
      },
    },
    cookieStore: true,
    headNext: true,
    viewTransition: true,
    typedPages: true,
  },

  compatibilityDate: '2024-04-03',

  nitro: {
    replace: {
      'import.meta.test': isTest,
    },
    future: { nativeSWR: true },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/rss.xml', '/voted', '/work', '/feedback', '/ama', '/ai'],
    },
    hooks: {
      'prerender:generate' (route) {
        if (route.fileName)
          route.fileName = route.fileName.replace(
            /(\.\w{3})\/index.html$/,
            '$1',
          )

        if (route.fileName?.endsWith('.html') && route.contents) {
          route.contents = route.contents.replace(/(src|href|srcset)="\/_ipx[^"]+"/g, r => r.replaceAll('//', '/'))
        }

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
    vue: {
      features: {
        optionsAPI: false,
      },
    },
  },

  typescript: {
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
      'devoxx.gr',
      'conference.vueschool.io',
      'static-cdn.jtvnw.net',
      'avatars.githubusercontent.com',
      'raw.githubusercontent.com',
      's3.nl-ams.scw.cloud',
      'cdn.bsky.social',
      'cdn.bsky.app',
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
        'img-src': ['\'self\'', 'data:', 'https://avatars.githubusercontent.com'],
      },
    },
  },

  social: {
    networks: {
      bluesky: {
        identifier: 'roe.dev',
      },
      mastodon: {
        identifier: 'daniel@roe.dev',
      },
    },
  },
})
