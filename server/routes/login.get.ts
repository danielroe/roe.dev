import { getOauth } from '../utils/admin/oauth'

export default defineEventHandler(async event => {
  const handle = useRuntimeConfig(event).atproto.handle
  if (!handle) {
    throw createError({ statusCode: 500, statusMessage: 'No atproto handle is configured (social.networks.bluesky.identifier).' })
  }

  const url = await (await getOauth(event)).authorize(handle)
  return sendRedirect(event, url.toString(), 303)
})
