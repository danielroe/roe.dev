/**
 * Serves the OAuth client metadata document at
 * `https://roe.dev/oauth-client-metadata.json`, referenced by the OAuth
 * `client_id` in production. Dev uses a loopback `client_id` that encodes
 * the same data inline and never hits this route.
 */
import { getClientMetadata } from '../utils/admin/oauth'

export default defineEventHandler(event => {
  setHeader(event, 'Content-Type', 'application/json')
  return getClientMetadata(event)
})
