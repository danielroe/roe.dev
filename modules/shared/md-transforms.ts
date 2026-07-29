const SITE_URL = 'https://roe.dev'

/** Rewrite absolute roe.dev links to their .md equivalents. */
export function mdInternalLinks (content: string): string {
  return content.replace(
    /\]\(https:\/\/roe\.dev(\/[^)]*?)\)/g,
    (_match, path: string) => {
      if (/\.(xml|png|jpg|jpeg|svg|webp|pdf|webmanifest|json|css|js)$/i.test(path)) return `](${SITE_URL}${path})`
      if (path.startsWith('/.well-known/')) return `](${SITE_URL}${path})`
      if (path.endsWith('.md')) return `](${SITE_URL}${path})`
      if (path.includes('@')) return `](${SITE_URL}${path})`

      const clean = path.replace(/\/$/, '') || '/index'
      return `](${SITE_URL}${clean}.md)`
    },
  )
}

const PRESENTATIONAL_TAGS = ['div', 'span', 'p', 'ul', 'ol', 'figure', 'figcaption']

/**
 * Drop MDC container markers around presentational elements (`::div{.text-xl}`
 * … `::`) so the plain-markdown routes serve prose rather than layout syntax.
 * Component containers such as `::social-post` are left alone; they are handled
 * by the serialisers.
 */
export function mdStripContainers (content: string): string {
  const open = new RegExp(`^:{2,}(?:${PRESENTATIONAL_TAGS.join('|')})(?:\\{[^}]*\\})?$`)
  const lines = content.split('\n')
  const depth: number[] = []

  return lines.filter(line => {
    const trimmed = line.trim()
    if (open.test(trimmed)) {
      depth.push(trimmed.match(/^:+/)![0].length)
      return false
    }
    if (/^:+$/.test(trimmed) && depth.at(-1) === trimmed.length) {
      depth.pop()
      return false
    }
    return true
  }).join('\n').replace(/\n{3,}/g, '\n\n')
}

/** Convert residual HTML elements in markdown to their markdown equivalents. */
export function mdCleanHtml (content: string): string {
  return content
    .replace(/<p[^>]*><img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*><\/p>/g, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
    .replace(/<(?:div|span)[^>]*>/g, '')
    .replace(/<\/(?:div|span)>/g, '')
    .replace(/<p[^>]*class="[^"]*"[^>]*>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
