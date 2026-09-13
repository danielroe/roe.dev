import { clearAdminSessionCookie, getAdminSessionCookie, getOauth } from '../../../utils/admin/oauth'

export default defineEventHandler(async event => {
  const sess = await getAdminSessionCookie(event)
  if (sess.data.did) {
    await (await getOauth(event)).revoke(sess.data.did).catch(err => {
      console.warn('[admin] OAuth revoke failed:', err instanceof Error ? err.message : err)
    })
  }
  await clearAdminSessionCookie(event)
  return sendRedirect(event, '/', 303)
})
