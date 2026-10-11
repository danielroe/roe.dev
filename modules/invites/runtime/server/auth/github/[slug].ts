import { createError, defineEventHandler, getQuery, getRouterParam, sendRedirect, useRuntimeConfig } from 'nuxt/server'
import type { RuntimeConfig } from 'nuxt/schema'
import { $fetch } from 'ofetch'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  const repo = slug && config.invites?.map?.[slug as keyof RuntimeConfig['invites']['map']]
  if (!repo) {
    throw createError({ status: 404 })
  }

  const { code } = getQuery(event)

  if (!code) {
    throw createError({
      status: 422,
      statusText: 'Missing authorisation code.',
    })
  }

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

  if (!access_token) {
    throw createError({
      status: 422,
      statusText: 'Authorisation code invalid.',
    })
  }

  const username = await createGitHub(access_token).users.me()
    .then(user => user.login)
    .catch(err => {
      console.error('viewer', err)
      return null
    })

  if (!username) {
    throw createError({
      status: 422,
      statusText: 'Access code invalid.',
    })
  }

  return sendRedirect(event, await inviteCollaborator(createGitHub(config.github.inviteToken), repo, username))
})
