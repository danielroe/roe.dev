import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useNuxt,
} from 'nuxt/kit'

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
