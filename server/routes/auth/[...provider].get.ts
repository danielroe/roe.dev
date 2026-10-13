import { createError, defineEventHandler, getQuery, sendRedirect, useRuntimeConfig } from 'nuxt/server'
import { $fetch } from 'ofetch'

export default defineEventHandler(async event => {
  const { code, error, error_description, error_uri } = getQuery(event)

  if (import.meta.dev) {
    console.log(event.url.pathname + event.url.search)
  }

  if (error) {
    console.log(error, error_description, error_uri)
    return sendRedirect(event, '/?auth_error=true')
  }

  if (!code) {
    throw createError({
      status: 422,
      statusText: 'Missing authorisation code.',
    })
  }

  const config = useRuntimeConfig()
  const { access_token } = await $fetch<{ access_token?: string }>(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: {
        client_id: config.public.githubClientId,
        client_secret: config.github.clientSecret,
        code,
      },
    },
  ).catch(err => {
    console.error('access', err)
    return {} as { access_token?: string }
  })

  if (access_token) {
    const gh = createGitHub(access_token)
    // Determine if user is a sponsor
    const [viewer, orgs, ids] = await Promise.all([
      gh.users.me().catch(err => {
        console.error('viewer', err)
        return undefined
      }),
      fetchOrgIds(gh).catch(err => {
        console.error('orgs', err)
        return [] as string[]
      }),
      getSponsors()
        .then(r => r.map(s => s.id))
        .catch(err => {
          console.error('sponsor', err)
          return [] as string[]
        }),
    ])

    const session = {
      sponsor: isSponsor(ids, viewer ? [viewer.id, ...orgs] : orgs),
      avatar: viewer?.avatarUrl,
      name: viewer?.name,
    }

    console.info(session)

    // set custom JWT claim
    await setUserSession(event, { authenticated: true, ...session })
  }

  return sendRedirect(event, '/')
})
