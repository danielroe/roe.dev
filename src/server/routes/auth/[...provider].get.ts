/* eslint-disable camelcase */

import { loginUser } from '../../utils/auth'
const sponsorQuery = `
query {
  user(login: "danielroe") {
    sponsors (first: 100) {
      edges {
        node {
          ...on User {
            id
          }
        }
    	}
    }
  }
}`

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
      query(access_token, sponsorQuery).then(r =>
        r.data.user.sponsors.edges.map(e => e.node.id)
      ),
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

const query = (access_token: string, query: string) =>
  $fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}` },
    body: { query },
  })
