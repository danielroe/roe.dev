/**
 * Sends the browser back through `/login` when the admin OAuth session is
 * gone, instead of leaving the page rendering empty state. A full page load
 * is used so the server middleware can re-issue the authorize redirect.
 */
export function redirectToLogin () {
  if (import.meta.server) return
  if (window.location.pathname === '/login') return
  window.location.href = '/login'
}

export function isUnauthorised (error: unknown) {
  const { statusCode, status } = (error ?? {}) as { statusCode?: number, status?: number }
  const code = statusCode ?? status
  return code === 401 || code === 403
}
