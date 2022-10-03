import { verifyUser } from '../utils/auth'

export default defineEventHandler(async event => {
  const payload = await verifyUser(event)
  return {
    authenticated: !!payload,
    sponsor: !!payload?.sponsor,
    avatar: payload?.avatar,
    name: payload?.name,
  }
})
