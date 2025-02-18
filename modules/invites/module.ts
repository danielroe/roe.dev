import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useNuxt,
} from 'nuxt/kit'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: 'invites',
  },
  defaults: {
    map: {
      euricom: 'danielroe/nailing-it-euricom-2024',
      // slug: 'danielroe/<repo>',
    } satisfies Record<string, string>,
  },
  setup (options) {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)
    const gitHubClientId = process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || nuxt.options.runtimeConfig.public.githubClientId

    nuxt.options.runtimeConfig.invites = {
      map: options.map,
    }

    nuxt.options.nitro.typescript = defu(nuxt.options.nitro.typescript, {
      include: ['../modules/runtime/server/**/*'],
    })

    if (!gitHubClientId || Object.values(options.map).length === 0) return

    const redirect = nuxt.options.dev
      ? '&redirect_uri=http://localhost:3000/auth/github'
      : '&redirect_uri=https://roe.dev/auth/github'

    nuxt.options.nitro.routeRules ||= {}
    for (const slug in options.map) {
      nuxt.options.nitro.routeRules['/' + slug] = {
        redirect: `https://github.com/login/oauth/authorize?client_id=${gitHubClientId}${redirect}/${slug}`,
      }
    }

    addServerHandler({
      route: '/auth/github/:slug',
      handler: resolver.resolve('./runtime/server/auth/github/[slug]'),
    })
  },
})
