import { createError, defineEventHandler, getRouterParam, sendRedirect, useRuntimeConfig } from 'nuxt/server'
import { $fetch } from 'ofetch'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[\da-z]+$/.test(slug)) {
    throw createError({ status: 400, statusText: 'Missing slug' })
  }
  await $fetch(slug, {
    baseURL: config.voteUrl,
    body: { type: 'vote' },
    method: 'POST',
  })
  return sendRedirect(event, '/voted')
})
