export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const { feedback } = await readBody(event)
  if (!feedback) {
    throw createError({ statusCode: 400, statusMessage: 'Missing feedback' })
  }
  await $fetch('feedback', {
    baseURL: config.voteUrl,
    body: { type: 'feedback', status: feedback },
    method: 'POST',
  })
  return null
})
