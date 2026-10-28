import { createError, defineEventHandler, getRouterParam, sendRedirect } from 'nuxt/server'

import { useParty } from '../../utils/party'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[\da-z]+$/.test(slug)) {
    throw createError({ status: 400, statusText: 'Missing slug' })
  }
  await (await useParty()).request(slug, { type: 'vote' })
  return sendRedirect(event, '/voted')
})
