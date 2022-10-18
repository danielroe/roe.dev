/* eslint-disable camelcase */

import { query } from '../../utils/github'
import { loginUser } from '../../utils/auth'
import { getSponsors } from '../../utils/sponsors'

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
        client_secret: config.github.clientSecret,
        code,
      },
    }
  ).catch(err => {
    console.error('access', err)
    return {}
  })

  if (access_token) {
    // Determine if user is a sponsor
    const [viewer, ids] = await Promise.all([
      query(access_token, 'query { viewer { id, name, avatarUrl } }')
        .then(r => r.data.viewer)
        .catch(err => {
          console.error('viewer', err)
          return {}
        }),
      getSponsors()
        .then(r => r.map(s => s.id))
        .catch(err => {
          console.error('sponsor', err)
          return []
        }),
    ])

    console.info({
      sponsor: ids.includes(viewer.id),
      avatar: viewer.avatarUrl,
      name: viewer.name,
    })

    // set custom JWT claim
    await loginUser(event, {
      sponsor: ids.includes(viewer.id),
      avatar: viewer.avatarUrl,
      name: viewer.name,
    })
  }

  return sendRedirect(event, '/')
})
