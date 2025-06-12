import { getFeedback, setFeedback, broadcastFeedback } from '../utils/websocket-rooms'

export default defineEventHandler(async event => {
  const { feedback } = await readBody(event)
  if (!feedback) {
    throw createError({ statusCode: 400, statusMessage: 'Missing feedback' })
  }

  const roomId = 'feedback'

  const currentFeedback = await getFeedback(roomId)
  const updatedFeedback = [...currentFeedback, feedback]

  event.waitUntil(Promise.all([
    setFeedback(roomId, updatedFeedback),
    broadcastFeedback(roomId, updatedFeedback),
  ]))

  return null
})
