export default defineEventHandler(async event => {
  if (event.method === 'OPTIONS') return null

  assertMethod(event, 'POST')
  const { question } = await readBody(event)
  if (!question) throw createError({ statusCode: 422 })
  event.waitUntil(createTypefullyDraft(event, question).catch(console.error))
  await sendEmail(event, 'Anonymous question', question)
  return null
})
