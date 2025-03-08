import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useNuxt,
} from 'nuxt/kit'
import { defu } from 'defu'

const networks = {
  bluesky: 'bluesky',
  mastodon: 'mastodon',
}

type Network = keyof typeof networks

type NetworkOptions = {
  bluesky?: {
    identifier: string
    password?: string
  }
  mastodon?: {
    identifier: string
  }
}

export default defineNuxtModule({
  meta: {
    name: 'social-sync',
    configKey: 'social',
  },
  defaults: {
    networks: {} as NetworkOptions,
  },
  setup (options) {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)

    if (options.networks.bluesky) {
      options.networks.bluesky.password ||= ''
    }

    nuxt.options.runtimeConfig.social = {
      networks: options.networks as any,
    }

    // Prevent all the extra stuff `masto` will add
    nuxt.options.alias['node-fetch'] = 'node-fetch-native'
    nuxt.options.build.transpile.push(
      'masto',
      '@mastojs/ponyfills',
      'magic-string',
    )

    nuxt.options.nitro = defu(nuxt.options.nitro, {
      alias: {
        'eventemitter3': 'unenv/mock/proxy',
        'isomorphic-ws': 'unenv/mock/proxy',
      },
    })

    nuxt.options.alias = defu(nuxt.options.alias, {
      '@jridgewell/sourcemap-codec': resolver.resolve(
        './mocks/sourcemap-codec',
      ),
      'qs': 'rollup-plugin-node-polyfills/polyfills/qs',
      'change-case': 'scule',
      'semver': resolver.resolve('./mocks/semver'),
    })

    for (const network in options.networks) {
      if (!isSupportedNetwork(network)) {
        console.warn('Ignoring unsupported network:', network)
        continue
      }
      addServerHandler({
        route: `/_social/${network}`,
        handler: resolver.resolve(`./runtime/server/_social/${network}.get.ts`),
      })
    }

    if (!nuxt.options.dev) {
      nuxt.options.nitro.routeRules ||= {}
      nuxt.options.nitro.routeRules['/_social/**'] = {
        isr: 60,
        swr: 60,
      }
    }
  },
})

function isSupportedNetwork (id: string): id is Network {
  return id in networks
}
