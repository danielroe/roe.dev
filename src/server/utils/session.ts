import type { H3Event } from 'h3'

interface SessionData {
  authenticated: boolean
  sponsor?: boolean
  avatar?: string
  name?: string
}

export function getUserSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  return getSession<SessionData>(event, {
    password: config.sessionPassword,
    name: 'token',
    cookie: { httpOnly: false },
  })
}

export function setUserSession(event: H3Event, data: any) {
  const config = useRuntimeConfig(event)
  return updateSession<SessionData>(
    event,
    {
      password: config.sessionPassword,
      name: 'token',
      cookie: { httpOnly: false },
    },
    data
  )
}

export function clearUserSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  return clearSession(event, {
    password: config.sessionPassword,
    name: 'token',
    cookie: { httpOnly: false },
  })
}
