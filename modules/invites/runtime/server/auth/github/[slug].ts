import type { RuntimeConfig } from 'nuxt/schema'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const slug = getRouterParam(event, 'slug')
  const repo = slug && config.invites?.map?.[slug as keyof RuntimeConfig['invites']['map']]
  if (!repo) {
    throw createError({ statusCode: 404 })
  }

  const { code } = getQuery(event)

  if (!code) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Missing authorisation code.',
    })
  }

  const { access_token, ...rest } = await $fetch<{ access_token: string }>(
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
      statusCode: 422,
      statusMessage: 'Authorisation code invalid.',
    })
  }

  console.log(access_token, config, rest)

  const username = await query(access_token, `{ viewer { login } }`)
    .then(r => r.data?.viewer.login)
    .then(r => encodeURIComponent(r))
    .catch(err => {
      console.error('viewer', err)
      return null
    })

  if (!username) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Access code invalid.',
    })
  }

  try {
    const res = await $fetch(
      `https://api.github.com/repos/${repo}/collaborators/${username}`,
      {
        method: 'PUT',
        body: { permission: 'push' },
        headers: {
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Authorization': `Bearer ${config.github.inviteToken}`,
        },
      },
    )

    console.log({ res })
  }
  catch (err) {
    console.log('could not add collaborator', err)
    console.log({ inviteToken: config.github.inviteToken })
  }
  return sendRedirect(event, `https://github.com/${repo}/invitations`)
})
