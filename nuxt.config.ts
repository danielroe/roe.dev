import { useNuxt } from 'nuxt/kit'
import { isTest } from 'std-env'

export default defineNuxtConfig({
  $production: {
    experimental: {
      noVueServer: true,
    },
    image: {
      provider: 'ipxStatic',
    },
  },

  $test: {
    experimental: {
      componentIslands: true,
    },
  },

  devtools: { enabled: true },
  runtimeConfig: {
    voteUrl: '',
    sessionPassword: '',
    // emailing ideas
    resendApiKey: '',
    twitch: {
      clientId: '',
      clientSecret: '',
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

  experimental: {
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

  sourcemap: false,

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

  devTo: {
    enabled: !!process.env.SYNC_DEV_TO,
  },

  srcDir: 'src',

  nitro: {
    replace: {
      'import.meta.test': isTest,
    },
    future: { nativeSWR: true },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/og/og.jpg', '/rss.xml', '/voted', '/work', '/feedback'],
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
          console.error(route.route, route.error, route)
          process.exit(1)
        }
      },
    },
  },

  routeRules: {
    '/api/hi': { cors: true },
    '/feed.xml': { redirect: '/rss.xml' },
    '/thumbnail/**': { cache: { maxAge: 60 * 60 * 24 * 365 } },
    '/chat': { redirect: 'https://roe.dev/blog/open-invitation' },
  },

  content: {
    highlight: {
      preload: ['js', 'ts', 'json', 'vue'],
      theme: 'material-theme-palenight',
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
      'devoxx.gr',
      'static-cdn.jtvnw.net',
      'avatars.githubusercontent.com',
      's3.nl-ams.scw.cloud',
      'cdn.bsky.social',
      'images.jsworldconference.com',
      'www.middlesbroughfe.co.uk',
      'res.cloudinary.com',
      'cityjsconf.org',
      'vuejsnation.com',
      'vueconf.us',
      'media.graphassets.com',
      'secure.meetupstatic.com',
      'cdn.evbuc.com',
    ],
    screens: {
      logo: 40,
      avatar: 70,
      380: 380,
      760: 760,
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

  eslint: {
    config: {
      stylistic: true,
    },
  },

  modules: [
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
    function (options, nuxt) {
      nuxt.hook('vite:extendConfig', config => {
        const deps = ['slugify', 'remark-gfm', 'remark-emoji', 'remark-mdc', 'remark-rehype', 'rehype-raw', 'parse5', 'unist-util-visit', 'unified', 'debug']
        config.optimizeDeps!.include = config.optimizeDeps!.include?.map(d => deps.includes(d) ? `@nuxt/content > ${d}` : d)
      })
    },
  ],
})
