import { pageMeta } from '#md-page-meta.json'

import { getUses } from '../utils/cms/uses'

export default defineEventHandler(async event => {
  if (import.meta.test) {
    return mdResponse('')
  }

  const categories = await getUses(event)
  const sorted = [...categories].sort((a, b) => (a.order || 100) - (b.order || 100))

  const lines = [
    mdFrontmatter('/uses', pageMeta['/uses']!),
    '',
  ]

  for (const category of sorted) {
    lines.push(`## ${category.title}`)
    lines.push('')

    const items = [...(category.items || [])].sort((a, b) => (a.order || 100) - (b.order || 100))
    for (const item of items) {
      const primaryLink = item.links?.[0]?.url
      const name = primaryLink ? `[${item.name}](${primaryLink})` : item.name
      const desc = item.description ? ` — ${item.description}` : ''
      lines.push(`- **${name}**${desc}`)

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
