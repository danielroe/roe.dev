import type { H3Event } from 'h3'

import { pageMeta } from '#md-page-meta.json'

function yamlEscape (str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function mdFrontmatter (path: string, meta: { title: string, description?: string, date?: string, tags?: string[] }): string {
  const lines = ['---']
  lines.push(`title: "${yamlEscape(meta.title)}"`)
  if (meta.date) {
    lines.push(`date: ${meta.date}`)
  }
  if (meta.tags) {
    lines.push(`tags: [${meta.tags.map(tag => `"${yamlEscape(tag)}"`).join(', ')}]`)
  }
  if (meta.description) {
    lines.push(`description: "${yamlEscape(meta.description)}"`)
  }
  lines.push(`url: ${SITE_URL}${path}`)
  lines.push('---')
  return lines.join('\n')
}

/**
 * Serve markdown as the response body.
 *
 * The body has to be a string: these routes are `swr` cached and nitro stores
 * whatever the handler returns, so a `Response` round-trips through the cache
 * as `{}` and every request after the first serves that instead of the document.
 */
export function mdResponse (event: H3Event, content: string): string {
  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  return content
}

/** Serve a content page (`/ai`, `/bio`) as plain markdown. */
export function contentPageResponse (event: H3Event, path: string): string {
  const page = contentPage(path)
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return mdResponse(event, [
    mdFrontmatter(path, pageMeta[path]!),
    '',
    page.meta.markdown,
    '',
  ].join('\n'))
}

export function formatDate (dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export type { Talk } from '#shared/cms/talks'

export interface Conference {
  name: string
  dates: string
  link?: string
  location?: string
}
