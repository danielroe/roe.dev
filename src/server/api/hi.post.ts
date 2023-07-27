export default defineEventHandler(async event => {
  const { body } = await readBody(event)
  if (!body) throw createError({ statusCode: 422 })

  await sendEmail('Hi there', body)
  return null
})
