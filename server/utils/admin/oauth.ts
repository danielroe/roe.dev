/**
 * atproto OAuth client for the /admin surface. Public client
 * (`token_endpoint_auth_method: 'none'`), DPoP-bound tokens. Identity +
 * per-collection CRUD on each `dev.roe.*` record type + blob upload.
 *
 * In production the client_id is the public metadata URL served at
 * `<baseUrl>/oauth-client-metadata.json`. Loopback / localhost base URLs
 * use the spec's `http://127.0.0.1?…` convention so no public hosting is
 * required in dev.
 */
import type { H3Event } from 'h3'
import { clearSession, getSession, updateSession } from 'h3'
import { NodeOAuthClient, requestLocalLock } from '@atproto/oauth-client-node'
import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node'

const SCOPES = [
  'atproto',
  'repo:dev.roe.ama',
  'repo:dev.roe.entity',
  'repo:dev.roe.invite',
  'repo:dev.roe.location',
  'repo:dev.roe.talk',
  'repo:dev.roe.talkGroup',
  'repo:dev.roe.usesCategory',
  'repo:dev.roe.usesItem',
  'blob:*/*',
] as const

export const OAUTH_SCOPE = SCOPES.join(' ')

// ---------- state store (in-flight authorize requests) ----------

class MemoryStateStore implements NodeSavedStateStore {
  private store = new Map<string, NodeSavedState>()
  async get (key: string) { return this.store.get(key) }
  async set (key: string, value: NodeSavedState) { this.store.set(key, value) }
  async del (key: string) { this.store.delete(key) }
}

const stateStore = new MemoryStateStore()

// ---------- admin session cookie ----------

interface AdminSessionData {
  did?: string
  handle?: string
  oauth?: {
    sub: string
    session: NodeSavedSession
  }
}

function sessionConfig (event: H3Event) {
  return {
    password: useRuntimeConfig(event).sessionPassword,
    name: 'admin-session',
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: !import.meta.dev,
      path: '/',
    },
  }
}

export function getAdminSessionCookie (event: H3Event) {
  return getSession<AdminSessionData>(event, sessionConfig(event))
}

export async function updateAdminSessionCookie (event: H3Event, patch: Partial<AdminSessionData>): Promise<void> {
  await updateSession<AdminSessionData>(event, sessionConfig(event), patch)
}

export function clearAdminSessionCookie (event: H3Event) {
  return clearSession(event, sessionConfig(event))
}

/**
 * The OAuth session payload (DPoP JWK + access/refresh tokens + AS
 * metadata) sealed with iron-session lands around 4-6 KB, close to the
 * 4096-byte per-cookie soft limit. If browsers start truncating it, this
 * needs to move to KV-backed storage.
 */
function cookieSessionStore (event: H3Event): NodeSavedSessionStore {
  return {
    async get (sub: string): Promise<NodeSavedSession | undefined> {
      const sess = await getAdminSessionCookie(event)
      return sess.data.oauth?.sub === sub ? sess.data.oauth.session : undefined
    },
    async set (sub: string, value: NodeSavedSession): Promise<void> {
      await updateAdminSessionCookie(event, { oauth: { sub, session: value } })
    },
    async del (sub: string): Promise<void> {
      const sess = await getAdminSessionCookie(event)
      if (sess.data.oauth?.sub === sub) {
        await updateAdminSessionCookie(event, { oauth: undefined })
      }
    },
  }
}

// ---------- client metadata ----------

interface ClientMetadata {
  client_id: string
  client_name: string
  client_uri?: string
  redirect_uris: [string]
  scope: string
  grant_types: ['authorization_code', 'refresh_token']
  response_types: ['code']
  token_endpoint_auth_method: 'none'
  application_type: 'web'
  dpop_bound_access_tokens: true
}

const LOOPBACK_RE = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/

/**
 * Returns the client metadata that `/oauth-client-metadata.json` serves
 * (prod), or — for loopback `baseUrl`s — that the spec's inline
 * `http://localhost?…` `client_id` encodes.
 */
export function getClientMetadata (event: H3Event): ClientMetadata {
  const baseUrl = useRuntimeConfig(event).admin.baseUrl.replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/admin/auth/callback`

  const isLoopback = LOOPBACK_RE.test(baseUrl)
  let clientId: string
  if (isLoopback) {
    const url = new URL('http://localhost')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', OAUTH_SCOPE)
    clientId = url.toString()
  }
  else {
    clientId = `${baseUrl}/oauth-client-metadata.json`
  }

  return {
    client_id: clientId,
    client_name: isLoopback ? 'roe.dev admin (dev)' : 'roe.dev admin',
    ...(isLoopback ? {} : { client_uri: baseUrl }),
    redirect_uris: [redirectUri],
    scope: OAUTH_SCOPE,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  }
}

/**
 * Builds a fresh OAuth client per request. The session store closes over
 * the H3 event, so the client can't be cached across requests.
 */
export function getOauthClient (event: H3Event): NodeOAuthClient {
  return new NodeOAuthClient({
    clientMetadata: getClientMetadata(event),
    stateStore,
    sessionStore: cookieSessionStore(event),
    requestLock: requestLocalLock,
  })
}
