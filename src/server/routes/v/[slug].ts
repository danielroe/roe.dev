export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[\da-z]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }
  await $fetch(slug, { baseURL: config.voteUrl, method: 'POST' })
  return await sendRedirect(event, '/voted')
})
