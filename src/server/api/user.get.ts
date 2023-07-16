export default defineEventHandler(async event => {
  const { data: payload } = await getUserSession(event)
  return {
    authenticated: payload.authenticated,
    sponsor: !!payload?.sponsor,
    avatar: payload?.avatar as string | undefined,
    name: payload?.name as string | undefined,
  }
})
