import { mdPages } from '#md-pages.json'

export default defineEventHandler(event => {
  if (event.method !== 'GET') return

  if (event.path.endsWith('.md')) return

  const clean = event.path.replace(/\/$/, '') || '/'
  if (!mdPages.has(clean)) return

  appendResponseHeader(event, 'Vary', 'Accept')

  const accept = getRequestHeader(event, 'accept') || ''
  if (!accept.includes('text/markdown')) return

  const dest = clean === '/' ? '/index.md' : `${clean}.md`
  return sendRedirect(event, dest, 302)
})
