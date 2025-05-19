import { addServerHandler, createResolver, defineNuxtModule } from 'nuxt/kit'
import { defu } from 'defu'
import { createClient } from '@sanity/client'

export default defineNuxtModule({
  meta: {
    name: 'invites',
  },
  async setup (_, nuxt) {
    nuxt.options.nitro.typescript = defu(nuxt.options.nitro.typescript, {
      include: ['../modules/runtime/server/**/*'],
    })

    if (nuxt.options._prepare) {
      return
    }

    const resolver = createResolver(import.meta.url)
    const gitHubClientId = process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || nuxt.options.runtimeConfig.public.githubClientId

    // fetch invitations from Sanity
    const sanityClient = createClient({
      projectId: '9bj3w2vo',
      dataset: 'production',
      apiVersion: '2025-02-19',
      token: process.env.NUXT_SANITY_TOKEN,
    })

    const invitations = await sanityClient.fetch<Array<{ slug: string, repo: string }>>(`*[_type == "invite" && isActive == true]{
      "slug": slug.current,
      repo
    }`)

    const map = Object.fromEntries(invitations.map(invite => [invite.slug, invite.repo]))

    nuxt.options.runtimeConfig.invites = { map }

    if (!gitHubClientId || invitations.length === 0) return

    const redirect = nuxt.options.dev
      ? '&redirect_uri=http://localhost:3000/auth/github'
      : '&redirect_uri=https://roe.dev/auth/github'

    nuxt.options.nitro.routeRules ||= {}
    for (const slug in map) {
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
