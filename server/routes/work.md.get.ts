import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(async () => {
  const repos = [
    'nuxt/nuxt',
    'danielroe/magic-regexp',
    'danielroe/fontaine',
    'danielroe/nuxt-vitest',
  ]

  const clients = [
    'Comcast',
    'Durham University',
    'Parent Scheme',
    'Concision',
    'North East Local Enterprise Partnership',
    'Convoke',
    'Acadian Software',
    'NuxtLabs',
    'Canvas8',
    'Imperial Enterprise Lab',
  ]

  const config = useRuntimeConfig()
  const formatter = new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    compactDisplay: 'short',
  })

  const repoData = await Promise.all(
    repos.map(async repo => {
      if (import.meta.dev || import.meta.test) {
        return { repo, stars: '1.4K', language: 'TypeScript' }
      }
      try {
        const { stargazers_count: stars, language, description } = await $fetch<any>(
          `https://api.github.com/repos/${repo}`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${config.github.token}`,
            },
          },
        )
        return { repo, stars: formatter.format(stars), language, description }
      }
      catch {
        return { repo, stars: '', language: '', description: '' }
      }
    }),
  )

  const lines = [
    mdFrontmatter('/work', pageMeta['/work']!),
    '',
    '## Open Source',
    '',
  ]

  for (const { repo, stars, language, description } of repoData) {
    const parts = [`**[${repo}](https://github.com/${repo})**`]
    if (description) parts.push(` — ${description}`)
    const meta: string[] = []
    if (stars) meta.push(`${stars} stars`)
    if (language) meta.push(language)
    if (meta.length) parts.push(` (${meta.join(', ')})`)
    lines.push(`- ${parts.join('')}`)
  }

  lines.push('')
  lines.push('## Past Clients')
  lines.push('')

  for (const client of clients) {
    lines.push(`- ${client}`)
  }

  lines.push('')

  return mdResponse(lines.join('\n'))
})
