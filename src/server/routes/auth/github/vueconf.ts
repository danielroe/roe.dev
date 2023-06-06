/* eslint-disable camelcase */

const repo = 'danielroe/nailing-it-vueconf-us-2023'

export default defineEventHandler(async event => {
  const { code } = getQuery(event)

  if (!code) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Missing authorisation code.',
    })
  }

  const config = useRuntimeConfig()
  const { access_token } = await $fetch<{ access_token: string }>(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: {
        client_id: config.public.githubClientId,
        client_secret: config.github.clientSecret,
        code,
      },
    }
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
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${config.github.inviteToken}`,
        },
      }
    )

    console.log({ res })
  } catch (err) {
    console.log('could not add collaborator', err)
  }
  return sendRedirect(event, `https://github.com/${repo}/invitations`)
})