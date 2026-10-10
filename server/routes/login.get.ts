import { createError, defineEventHandler, sendRedirect, useRuntimeConfig } from 'nuxt/server'

import { getOauth } from '../utils/admin/oauth'

export default defineEventHandler(async event => {
  const handle = useRuntimeConfig().atproto.handle
  if (!handle) {
    throw createError({ status: 500, statusText: 'No atproto handle is configured (social.networks.bluesky.identifier).' })
  }

  const url = await (await getOauth(event)).authorize(handle)
  return sendRedirect(event, url.toString(), 303)
})
