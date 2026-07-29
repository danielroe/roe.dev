import { getOauthClient } from '../utils/admin/oauth'

export default defineEventHandler(async event => {
  const handle = useRuntimeConfig().atproto.handle
  if (!handle) {
    throw createError({ status: 500, message: 'No atproto handle is configured (social.networks.bluesky.identifier).' })
  }

  const client = getOauthClient(event)
  const url = await client.authorize(handle, { scope: client.clientMetadata.scope })
  return redirect(url.toString(), 303)
})
