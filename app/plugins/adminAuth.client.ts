/**
 * Sends the browser back through `/login` when an `/api/admin` call reports
 * that the OAuth session is gone, instead of leaving the page rendering
 * empty state. A full page load is used so the server middleware can
 * re-issue the authorize redirect.
 */
export default defineNuxtPlugin(() => {
  globalThis.$fetch = $fetch.create({
    onResponseError ({ request, response }) {
      if (response.status !== 401) return

      const url = typeof request === 'string' ? request : request.url
      if (!url.includes('/api/admin/')) return

      window.location.href = '/login'
    },
  })
})
