export default defineEventHandler(async event => {
  if (event.method === 'OPTIONS') return null

  assertMethod(event, 'POST')
  const { question } = await readBody(event)
  if (!question) throw createError({ statusCode: 422 })
  event.waitUntil(sendEmail('Anonymous question', question))
  event.waitUntil(createTypefullyDraft(event, question))
  return null
})
