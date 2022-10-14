/* eslint-disable camelcase */

import { query } from '../../utils/github'
import { loginUser } from '../../utils/auth'
import { getSponsors } from '~~/src/server/utils/sponsors'

export default defineEventHandler(async event => {
  const { code } = getQuery(event)

  if (!code) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Missing authorisation code.',
    })
  }

  const config = useRuntimeConfig()
  const { access_token } = await $fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: {
        client_id: config.public.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      },
    }
  )

  if (access_token) {
    // Determine if user is a sponsor
    const [viewer, ids] = await Promise.all([
      query(access_token, 'query { viewer { id, name, avatarUrl } }').then(
        r => r.data.viewer
      ),
      getSponsors(),
    ])

    // set custom JWT claim
    await loginUser(event, {
      sponsor: ids.includes(viewer.id),
      avatar: viewer.avatarUrl,
      name: viewer.name,
    })
  }

  return sendRedirect(event, '/')
})
