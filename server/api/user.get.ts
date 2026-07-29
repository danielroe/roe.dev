import type { SessionUser } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<SessionUser> => {
  const { data: payload } = await getUserSession(event)
  return {
    authenticated: !!payload?.authenticated,
    sponsor: !!payload?.sponsor,
    avatar: payload?.avatar,
    name: payload?.name,
  }
})
