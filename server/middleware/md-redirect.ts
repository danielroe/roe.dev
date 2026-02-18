import { mdPages } from '#md-pages.json'

export default defineEventHandler(event => {
  if (event.method !== 'GET') return

  const accept = getRequestHeader(event, 'accept') || ''
  if (!accept.includes('text/markdown')) return

  if (event.path.endsWith('.md')) return

  const clean = event.path.replace(/\/$/, '') || '/'
  if (!mdPages.has(clean)) return

  const dest = clean === '/' ? '/index.md' : `${clean}.md`
  return sendRedirect(event, dest, 302)
})
