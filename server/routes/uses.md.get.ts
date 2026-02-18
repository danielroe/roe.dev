import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(async event => {
  if (import.meta.test) {
    return mdResponse('')
  }

  const sanity = useSanity(event)
  const categories = await sanity.client.fetch<UsesCategory[]>(`
    *[_type == "uses"] {
      _id,
      category,
      order,
      items[] {
        name,
        description,
        links[] {
          url,
          label
        },
        order
      }
    }
  `)

  const sorted = [...categories].sort((a, b) => (a.order || 100) - (b.order || 100))

  const lines = [
    mdFrontmatter('/uses', pageMeta['/uses']!),
    '',
  ]

  for (const category of sorted) {
    lines.push(`## ${category.category}`)
    lines.push('')

    const items = [...(category.items || [])].sort((a, b) => (a.order || 100) - (b.order || 100))
    for (const item of items) {
      const primaryLink = item.links?.[0]?.url
      const name = primaryLink ? `[${item.name}](${primaryLink})` : item.name
      const desc = item.description ? ` — ${item.description}` : ''
      lines.push(`- **${name}**${desc}`)

      // Additional links beyond the primary
      const extraLinks = item.links?.slice(1)
      if (extraLinks?.length) {
        const linkStr = extraLinks.map(l => `[${l.label || 'Link'}](${l.url})`).join(', ')
        lines.push(`  ${linkStr}`)
      }
    }

    lines.push('')
  }

  return mdResponse(lines.join('\n'))
})

interface UsesCategory {
  _id: string
  category: string
  order: number
  items: UsesItem[]
}

interface UsesItem {
  name: string
  description?: string
  links?: { url: string, label?: string }[]
  order?: number
}
