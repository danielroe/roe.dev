export default defineEventHandler(async event => {
  handleCors(event, {})

  if (getMethod(event) === 'OPTIONS') return null

  const { body } = await readBody(event)
  if (!body) throw createError({ statusCode: 422 })

  await sendEmail('Hi there', body)
  return null
})
