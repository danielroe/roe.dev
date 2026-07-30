import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import process from 'node:process'

import { defineNuxtConfig } from 'nuxt/config'
import { extendViteConfig } from 'nuxt/kit'
import { isTest } from 'std-env'
import type { HmrOptions } from 'vite'
import { pageMeta } from './modules/shared/page-meta'

/**
 * Rendered routes served from the SWR cache. Applied outside development only:
 * nitro persists SWR responses to `.nuxt/cache`, so in dev an edit to content
 * or a component stays invisible until the cached entry expires. Tests opt in
 * so they cover what the cache does to a handler's return value.
 */
const renderedSwrRules: Record<string, { swr: number }> = {
  ...Object.fromEntries(Object.keys(pageMeta).flatMap(path => [
    [path, { swr: 60 * 60 }],
    [path + '/_payload.json', { swr: 60 * 60 }],
    [path + '.md', { swr: 60 * 60 }],
  ])),
  '/blog/**': { swr: 60 * 60 },
}

/** API routes served from the SWR cache, in dev too, to spare the upstreams. */
const apiSwrRules: Record<string, { swr: number }> = {
  '/api/talks': { swr: 60 * 60 },
  '/api/upcoming-conferences': { swr: 60 * 60 },
  '/api/uses': { swr: 60 * 60 },
  '/api/current-location': { swr: 60 * 5 },
}

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
    '@comark/nuxt',
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
    routeRules: renderedSwrRules,
  },

  $test: {
    modules: [
      function () {
        extendViteConfig(config => {
          config.plugins = config.plugins?.filter(p => !p || !('name' in p) || p.name !== 'nuxt:scripts:bundler-transformer')
        })
      },
    ],
    routeRules: renderedSwrRules,
    experimental: {
      componentIslands: true,
    },
  },

  components: [
    // markdown components are passed explicitly to `<ComarkRenderer>` rather
    // than registered globally, so they stay out of the client bundle
    { path: '~/components/markdown', pathPrefix: false },
    '~/components',
  ],

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
    ...apiSwrRules,
    '/admin/**': { prerender: false },
    '/api/sponsors': { prerender: true },
    '/api/hi': { cors: true },
    // redirects
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
    externals: {
      // `@atproto-labs/fetch-node` depends on undici via npm aliases
      // (`undici_v6`, etc.), which nitro's externals tracing collapses to the
      // real package name, breaking the aliased imports at runtime.
      // https://github.com/nitrojs/nitro/issues/1574
      traceAlias: Object.fromEntries(
        ['undici_v6', 'undici_v7', 'undici_v8'].flatMap(alias => {
          try {
            let req = createRequire(import.meta.url)
            for (const hop of ['@atproto/oauth-client-node', '@atproto-labs/handle-resolver-node', '@atproto-labs/fetch-node']) {
              req = createRequire(req.resolve(hop))
            }
            const { version } = req(`${alias}/package.json`)
            return [[`.nitro/undici@${version}`, alias]]
          }
          catch {
            return []
          }
        }),
      ),
    },
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
        if (route.fileName)
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
    $client: {
      build: {
        rollupOptions: {
          output: {
            codeSplitting: {
              groups: [
                {
                  name: 'shared',
                  tags: ['$initial'],
                },
              ],
            },
          },
        },
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

  hooks: {
    /**
     * The client manifest is inlined into the server bundle rather than emitted
     * to disk, so persist a copy when a consumer asks for one by setting
     * `NUXT_CLIENT_MANIFEST_PATH` (see `test/unit/bundle.spec.ts`).
     */
    async 'build:manifest' (manifest) {
      const target = process.env.NUXT_CLIENT_MANIFEST_PATH
      if (!target) return
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, JSON.stringify(manifest), 'utf8')
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
