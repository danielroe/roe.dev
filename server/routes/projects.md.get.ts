import { projects } from '#projects.json'
import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(() => {
  const lines = [
    mdFrontmatter('/projects', pageMeta['/projects']!),
    '',
  ]

  for (const category of projects) {
    lines.push(`## ${category.category}`)
    lines.push('')

    for (const item of category.items) {
      const primaryUrl = item.url || item.repo
      const name = primaryUrl ? `[${item.name}](${primaryUrl})` : item.name
      const desc = item.description ? ` — ${item.description}` : ''
      const archived = item.archived ? ' _(archived)_' : ''
      lines.push(`- **${name}**${archived}${desc}`)

      if (item.repo && item.repo !== item.url) {
        lines.push(`  [Source](${item.repo})`)
      }
    }

    lines.push('')
  }

  return mdResponse(lines.join('\n'))
})
