import { sendPushoverNotification } from '../utils/pushover'

export default defineEventHandler(async event => {
  const { data: payload } = await getUserSession(event)
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not Authenticated',
    })
  }
  if (!payload.sponsor) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not Authorized',
    })
  }
  const { idea } = await readBody(event)
  await sendPushoverNotification(event, {
    title: 'Idea from website',
    message: [`Idea from ${payload.name}:`, '', idea].join('\n'),
  })
  return null
})
