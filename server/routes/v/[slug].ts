export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[\da-z]+$/.test(slug)) {
    throw createError({ status: 400, message: 'Missing slug' })
  }
  await $fetch(slug, {
    baseURL: config.voteUrl,
    body: { type: 'vote' },
    method: 'POST',
  })
  return await redirect('/voted')
})
