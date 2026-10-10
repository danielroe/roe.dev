import { createError, defineEventHandler, readBody, useRuntimeConfig } from 'nuxt/server'
import { $fetch } from 'ofetch'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const { feedback } = await readBody<{ feedback?: string }>(event)
  if (!feedback) {
    throw createError({ status: 400, statusText: 'Missing feedback' })
  }
  await $fetch('feedback', {
    baseURL: config.voteUrl,
    body: { type: 'feedback', status: feedback },
    method: 'POST',
  })
  return null
})
