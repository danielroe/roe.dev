import { sendEmail } from '../utils/email'

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
  await sendEmail(
    'Idea from website',
    [`Idea from ${payload.name}:`, '', idea].join('\n'),
  )
  event.res.statusCode = 204
  event.res.end()
})
