import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useNuxt,
} from 'nuxt/kit'
import { defu } from 'defu'

const networks = {
  mastodon: 'mastodon',
}

type Network = keyof typeof networks

type NetworkOptions = {
  identifier: string
}

export default defineNuxtModule({
  meta: {
    name: 'social-sync',
    configKey: 'social',
  },
  defaults: {
    networks: {} as Partial<Record<Network, NetworkOptions>>,
  },
  setup(options) {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)

    // Prevent all the extra stuff `masto` will add
    nuxt.options.alias['node-fetch'] = 'node-fetch-native'
    nuxt.options.build.transpile.push('masto', '@mastojs/ponyfills')

    nuxt.options.nitro = defu(nuxt.options.nitro, {
      alias: {
        eventemitter3: 'unenv/runtime/mock/proxy',
        'isomorphic-ws': 'unenv/runtime/mock/proxy',
      },
    })

    nuxt.options.alias = defu(nuxt.options.alias, {
      querystring: 'rollup-plugin-node-polyfills/polyfills/qs',
      'change-case': 'scule',
      semver: resolver.resolve('./mocks/semver'),
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

    nuxt.options.nitro.routeRules ||= {}
    nuxt.options.nitro.routeRules['/_social/**'] = {
      swr: 60,
    }
  },
})

function isSupportedNetwork(id: string): id is Network {
  return id in networks
}
