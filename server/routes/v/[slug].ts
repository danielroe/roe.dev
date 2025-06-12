import { incrementVote, broadcastVotes } from '../../utils/websocket-rooms'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[\da-z]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const votes = await incrementVote(slug, slug)

  const count = votes[slug] || 0
  await broadcastVotes(slug, slug, count)

  return await sendRedirect(event, '/voted')
})
