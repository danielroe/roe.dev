import { getOauthClient } from '../utils/admin/oauth'

export default defineEventHandler(async event => {
  const handle = useRuntimeConfig(event).atproto.handle
  if (!handle) {
    throw createError({ statusCode: 500, statusMessage: 'No atproto handle is configured (social.networks.bluesky.identifier).' })
  }

  const client = getOauthClient(event)
  const url = await client.authorize(handle, { scope: client.clientMetadata.scope })
  return sendRedirect(event, url.toString(), 303)
})
