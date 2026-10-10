/**
 * atproto OAuth for the `/admin` surface. Public client
 * (`token_endpoint_auth_method: 'none'`), DPoP-bound tokens, with the scopes
 * derived from the collections in `shared/collections.ts`.
 *
 * In production the client_id is the metadata URL served at
 * `<baseUrl>/oauth-client-metadata.json`. Loopback base URLs use the spec's
 * `http://localhost?…` convention, so dev needs no public hosting.
 */
import { clearSession, createError, getSession, updateSession, useRuntimeConfig } from 'nuxt/server'
import type { RequestEvent, SessionConfig } from 'nuxt/server'
import { scopesFor } from 'airspace'
import { clientMetadata, createOAuth } from 'airspace/oauth'
import type { NodeSavedSessionStore, NodeSavedStateStore, OAuthSession } from 'airspace/oauth'

import { collections } from '#shared/collections'

const REDIRECT_PATH = '/api/admin/auth/callback'

export const OAUTH_SCOPES = scopesFor({ collections })

// `airspace/oauth` re-exports the store interfaces but not the values they hold.
type NodeSavedSession = NonNullable<Awaited<ReturnType<NodeSavedSessionStore['get']>>>
type NodeSavedState = NonNullable<Awaited<ReturnType<NodeSavedStateStore['get']>>>

type AdminStateData = {
  key?: string
  state?: NodeSavedState
}

type AdminSessionData = {
  did?: string
  handle?: string
  oauth?: {
    sub: string
    session: NodeSavedSession
  }
}

const sessionConfig: SessionConfig = {
  name: 'admin-session',
  cookie: { secure: !import.meta.dev },
}

export function getAdminSessionCookie (event: RequestEvent) {
  return getSession<AdminSessionData>(event, sessionConfig)
}

export async function updateAdminSessionCookie (event: RequestEvent, patch: Partial<AdminSessionData>): Promise<void> {
  await updateSession<AdminSessionData>(event, sessionConfig, patch)
}

export function clearAdminSessionCookie (event: RequestEvent) {
  return clearSession(event, sessionConfig)
}

const stateSessionConfig: SessionConfig = {
  ...sessionConfig,
  name: 'admin-oauth-state',
  maxAge: 60 * 10,
}

/**
 * In-flight authorization state, held in a short-lived cookie: `authorize()`
 * and the callback are separate requests that are not guaranteed to hit the
 * same serverless instance, so it cannot live in process memory.
 */
function cookieStateStore (event: RequestEvent): NodeSavedStateStore {
  return {
    async get (key: string): Promise<NodeSavedState | undefined> {
      const sess = await getSession<AdminStateData>(event, stateSessionConfig)
      return sess.data.key === key ? sess.data.state : undefined
    },
    async set (key: string, value: NodeSavedState): Promise<void> {
      await updateSession<AdminStateData>(event, stateSessionConfig, { key, state: value })
    },
    async del (): Promise<void> {
      await clearSession(event, stateSessionConfig)
    },
  }
}

function baseUrlFor (): string {
  return useRuntimeConfig().admin.baseUrl.replace(/\/$/, '')
}

function nameFor (baseUrl: string): string {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl) ? 'roe.dev admin (dev)' : 'roe.dev admin'
}

/** The document `/oauth-client-metadata.json` serves. */
export function getClientMetadata () {
  const baseUrl = baseUrlFor()
  return clientMetadata({ baseUrl, redirectPath: REDIRECT_PATH, name: nameFor(baseUrl), scopes: OAUTH_SCOPES })
}

/**
 * The OAuth session payload (DPoP JWK + access/refresh tokens + AS metadata)
 * sealed with iron lands around 4-6 KB, close to the 4096-byte per-cookie
 * limit. Sealing throws once it outgrows that, at which point this needs to
 * move to KV-backed storage.
 */
function cookieSessionStore (event: RequestEvent): NodeSavedSessionStore {
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
export function getOauth (event: RequestEvent) {
  const baseUrl = baseUrlFor()
  return createOAuth({
    baseUrl,
    redirectPath: REDIRECT_PATH,
    name: nameFor(baseUrl),
    scopes: OAUTH_SCOPES,
    stores: { state: cookieStateStore(event), session: cookieSessionStore(event) },
  })
}

/** Restore the editor's OAuth session, for `createAirspace({ session })`. */
export async function requireAdminSession (event: RequestEvent): Promise<OAuthSession> {
  const sess = await getAdminSessionCookie(event)
  const did = sess.data.did
  if (!did) {
    throw createError({ status: 401, statusText: 'Not signed in.' })
  }

  try {
    return await (await getOauth(event)).restore(did)
  }
  catch (err) {
    console.warn('[admin] OAuth restore failed:', err instanceof Error ? err.message : err)
    await clearAdminSessionCookie(event)
    throw createError({ status: 401, statusText: 'Session expired. Please sign in again.' })
  }
}
