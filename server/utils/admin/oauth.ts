/**
 * atproto OAuth for the `/admin` surface. Public client
 * (`token_endpoint_auth_method: 'none'`), DPoP-bound tokens, with the scopes
 * derived from the collections in `shared/collections.ts`.
 *
 * In production the client_id is the metadata URL served at
 * `<baseUrl>/oauth-client-metadata.json`. Loopback base URLs use the spec's
 * `http://localhost?…` convention, so dev needs no public hosting.
 */
import type { H3Event } from 'h3'
import { clearSession, getSession, updateSession } from 'h3'
import { scopesFor } from 'airspace'
import { clientMetadata, createOAuth } from 'airspace/oauth'
import type { NodeSavedSessionStore, NodeSavedStateStore, OAuthSession } from 'airspace/oauth'

import { collections } from '#shared/collections'

const REDIRECT_PATH = '/api/admin/auth/callback'

export const OAUTH_SCOPES = scopesFor({ collections })

// `airspace/oauth` re-exports the store interfaces but not the values they hold.
type NodeSavedSession = NonNullable<Awaited<ReturnType<NodeSavedSessionStore['get']>>>
type NodeSavedState = NonNullable<Awaited<ReturnType<NodeSavedStateStore['get']>>>

interface AdminStateData {
  key?: string
  state?: NodeSavedState
}

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

function stateSessionConfig (event: H3Event) {
  return {
    ...sessionConfig(event),
    name: 'admin-oauth-state',
    maxAge: 60 * 10,
  }
}

/**
 * In-flight authorization state, held in a short-lived cookie: `authorize()`
 * and the callback are separate requests that are not guaranteed to hit the
 * same serverless instance, so it cannot live in process memory.
 */
function cookieStateStore (event: H3Event): NodeSavedStateStore {
  return {
    async get (key: string): Promise<NodeSavedState | undefined> {
      const sess = await getSession<AdminStateData>(event, stateSessionConfig(event))
      return sess.data.key === key ? sess.data.state : undefined
    },
    async set (key: string, value: NodeSavedState): Promise<void> {
      await updateSession<AdminStateData>(event, stateSessionConfig(event), { key, state: value })
    },
    async del (): Promise<void> {
      await clearSession(event, stateSessionConfig(event))
    },
  }
}

function baseUrlFor (event: H3Event): string {
  return useRuntimeConfig(event).admin.baseUrl.replace(/\/$/, '')
}

function nameFor (baseUrl: string): string {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl) ? 'roe.dev admin (dev)' : 'roe.dev admin'
}

/** The document `/oauth-client-metadata.json` serves. */
export function getClientMetadata (event: H3Event) {
  const baseUrl = baseUrlFor(event)
  return clientMetadata({ baseUrl, redirectPath: REDIRECT_PATH, name: nameFor(baseUrl), scopes: OAUTH_SCOPES })
}

/**
 * The OAuth session payload (DPoP JWK + access/refresh tokens + AS metadata)
 * sealed with iron-session lands around 4-6 KB, close to the 4096-byte
 * per-cookie soft limit. If browsers start truncating it, this needs to move
 * to KV-backed storage.
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

/**
 * Built per request, because the session store closes over the event.
 */
export function getOauth (event: H3Event) {
  const baseUrl = baseUrlFor(event)
  return createOAuth({
    baseUrl,
    redirectPath: REDIRECT_PATH,
    name: nameFor(baseUrl),
    scopes: OAUTH_SCOPES,
    stores: { state: cookieStateStore(event), session: cookieSessionStore(event) },
  })
}

/** Restore the editor's OAuth session, for `createAirspace({ session })`. */
export async function requireAdminSession (event: H3Event): Promise<OAuthSession> {
  const sess = await getAdminSessionCookie(event)
  const did = sess.data.did
  if (!did) {
    throw createError({ statusCode: 401, statusMessage: 'Not signed in.' })
  }

  try {
    return await (await getOauth(event)).restore(did)
  }
  catch (err) {
    console.warn('[admin] OAuth restore failed:', err instanceof Error ? err.message : err)
    await clearAdminSessionCookie(event)
    throw createError({ statusCode: 401, statusMessage: 'Session expired. Please sign in again.' })
  }
}
