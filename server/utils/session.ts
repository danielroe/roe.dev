import { clearSession, getSession, updateSession } from 'nuxt/server'
import type { RequestEvent, SessionConfig } from 'nuxt/server'

type SessionData = {
  authenticated: boolean
  sponsor?: boolean
  avatar?: string
  name?: string
}

const sessionConfig: SessionConfig = {
  name: 'token',
  cookie: { httpOnly: false },
}

export function getUserSession (event: RequestEvent) {
  return getSession<SessionData>(event, sessionConfig)
}

export function setUserSession (event: RequestEvent, data: Partial<SessionData>) {
  return updateSession<SessionData>(event, sessionConfig, data)
}

export function clearUserSession (event: RequestEvent) {
  return clearSession(event, sessionConfig)
}
