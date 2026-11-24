import { addServerHandler, createResolver, defineNuxtModule, extendRouteRules, updateRuntimeConfig, useNuxt } from 'nuxt/kit'
import { defu } from 'defu'
import { z } from 'zod'

const networks = {
  bluesky: 'bluesky',
  mastodon: 'mastodon',
  linkedin: 'linkedin',
}

type Network = keyof typeof networks

type NetworkOptions = {
  bluesky?: {
    identifier: string
  }
  mastodon?: {
    identifier: string
  }
  linkedin?: {
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

    updateRuntimeConfig({
      social: z.object({
        networks: z.object({
          bluesky: z.object({
            identifier: z.string(),
          }),
          mastodon: z.object({
            identifier: z.string(),
          }),
          linkedin: z.object({
            identifier: z.string(),
          }),
        }),
      }).default({ networks: options.networks as Required<NetworkOptions> }),
    })

    // Prevent all the extra stuff `masto` will add
    nuxt.options.alias['node-fetch'] = 'node-fetch-native'
    nuxt.options.build.transpile.push(
      'masto',
      'magic-string',
    )

    nuxt.options.alias = defu(nuxt.options.alias, {
      '@jridgewell/sourcemap-codec': resolver.resolve('./mocks/sourcemap-codec'),
      'qs': 'rollup-plugin-node-polyfills/polyfills/qs',
      'change-case': 'scule',
      'semver': resolver.resolve('./mocks/semver'),
    })

    for (const network in options.networks) {
      if (!isSupportedNetwork(network)) {
        continue
      }
      addServerHandler({
        route: `/_social/${network}`,
        handler: resolver.resolve(`./runtime/server/_social/${network}.get.ts`),
      })
    }

    if (!nuxt.options.dev) {
      extendRouteRules('/_social/**', { isr: 60, swr: 60 })
    }
  },
})

function isSupportedNetwork (id: string): id is Network {
  return id in networks
}
