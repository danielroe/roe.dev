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
