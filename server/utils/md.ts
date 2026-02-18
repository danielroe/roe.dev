const SITE_URL = 'https://roe.dev'

function yamlEscape (str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function mdFrontmatter (path: string, meta: { title: string, description?: string }): string {
  const lines = ['---']
  lines.push(`title: "${yamlEscape(meta.title)}"`)
  if (meta.description) {
    lines.push(`description: "${yamlEscape(meta.description)}"`)
  }
  lines.push(`url: ${SITE_URL}${path}`)
  lines.push('---')
  return lines.join('\n')
}

export function mdInternalLinks (content: string): string {
  return content.replace(
    /\]\(https:\/\/roe\.dev(\/[^)]*?)\)/g,
    (_match, path: string) => {
      // Skip non-page resources
      if (/\.(xml|png|jpg|jpeg|svg|webp|pdf|webmanifest|json|css|js)$/i.test(path)) return `](${SITE_URL}${path})`
      if (path.startsWith('/.well-known/')) return `](${SITE_URL}${path})`
      if (path.endsWith('.md')) return `](${SITE_URL}${path})`
      // Skip mailto and other non-path links
      if (path.includes('@')) return `](${SITE_URL}${path})`

      // Normalise trailing slash
      const clean = path.replace(/\/$/, '') || '/index'
      return `](${SITE_URL}${clean}.md)`
    },
  )
}

export function mdCleanHtml (content: string): string {
  return content
    // Convert <img> wrapped in a <p> to markdown image
    .replace(/<p[^>]*><img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*><\/p>/g, '![$2]($1)')
    // Convert standalone <img> to markdown image
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
    // Strip opening div/span tags (keep content)
    .replace(/<(?:div|span)[^>]*>/g, '')
    // Strip closing div/span tags
    .replace(/<\/(?:div|span)>/g, '')
    // Strip <p> with only classes (presentational)
    .replace(/<p[^>]*class="[^"]*"[^>]*>/g, '')
    .replace(/<\/p>/g, '')
    // Collapse multiple blank lines left behind
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function mdResponse (content: string): Response {
  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
