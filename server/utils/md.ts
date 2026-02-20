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

export function mdResponse (content: string): Response {
  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}

export function formatDate (dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export interface Talk {
  _id: string
  title: string
  description?: string
  source: string
  tags?: string[]
  link?: string
  video?: string
  date: string
  type: string
  slides?: string
  repo?: string
  demo?: string
  group?: {
    _id: string
    title?: string
    description?: string
  }
}

export interface Conference {
  name: string
  dates: string
  link?: string
  location?: string
}
