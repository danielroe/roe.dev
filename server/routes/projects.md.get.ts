import { pageMeta } from '#md-page-meta.json'

import { getProjects } from '../utils/cms/projects'

export default defineEventHandler(async event => {
  if (import.meta.test) {
    return mdResponse('')
  }

  const categories = await getProjects(event)

  const lines = [
    mdFrontmatter('/projects', pageMeta['/projects']!),
    '',
  ]

  for (const category of categories) {
    lines.push(`## ${category.title}`)
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
