export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const { feedback } = await requireBody<{ feedback?: string }>(event)
  if (!feedback) {
    throw createError({ status: 400, message: 'Missing feedback' })
  }
  await $fetch('feedback', {
    baseURL: config.voteUrl,
    body: { type: 'feedback', status: feedback },
    method: 'POST',
  })
  return null
})
