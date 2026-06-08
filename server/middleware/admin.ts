import { getAdminSessionCookie } from '../utils/admin/oauth'

const PUBLIC_PATHS = new Set<string>([
  '/api/admin/auth/callback',
  '/api/admin/auth/logout',
])

export default defineEventHandler(async event => {
  const path = event.path?.split('?')[0] ?? ''
  const isAdminPage = path === '/admin' || path.startsWith('/admin/')
  const isAdminApi = path.startsWith('/api/admin/')

  if (!isAdminPage && !isAdminApi) return
  if (PUBLIC_PATHS.has(path)) return

  const expectedHandle = useRuntimeConfig(event).atproto.handle
  const sess = await getAdminSessionCookie(event)
  if (sess.data.handle === expectedHandle && sess.data.did) return

  if (isAdminApi) {
    throw createError({ statusCode: 401, statusMessage: 'Not signed in.' })
  }
  return sendRedirect(event, '/login', 303)
})
