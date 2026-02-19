import { rawBlogPosts } from '#md-raw-blog.json'
import { pageMeta } from '#md-page-meta.json'
import { links } from '#shared/utils/links'

export default defineEventHandler(async () => {
  if (import.meta.test) {
    return new Response('', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const upcomingConferences = await $fetch<Conference[]>('/api/upcoming-conferences').catch(() => [] as Conference[])

  const recentPosts = rawBlogPosts.slice(0, 5)

  const pageIndex = Object.entries(pageMeta)
    .filter(([, meta]) => meta.llmLabel)
    .map(([path, meta]) => `- [${meta.title}](https://roe.dev${path}.md): ${meta.llmLabel}`)

  const lines = [
    '# Daniel Roe',
    '',
    '> Nuxt core team lead, open source maintainer, and keynote speaker. Part of the team at Vercel. Based in Scotland.',
    '',
    '## About',
    '',
    ...pageIndex,
    '',
    '## Key Links',
    '',
    '- Website: https://roe.dev',
    ...links
      .filter(l => l.link.startsWith('https://'))
      .map(l => `- ${l.name}: ${l.link}`),
    '- Nuxt: https://nuxt.com',
    '- Email: daniel@roe.dev',
    '',
  ]

  if (upcomingConferences.length) {
    lines.push('## Upcoming Conferences')
    lines.push('')
    for (const conf of upcomingConferences) {
      lines.push(`- ${conf.name} — ${conf.dates}${conf.location ? ` (${conf.location})` : ''}`)
    }
    lines.push('')
  }

  if (recentPosts.length) {
    lines.push('## Recent Blog Posts')
    lines.push('')
    for (const post of recentPosts) {
      lines.push(`- [${post.title}](https://roe.dev/blog/${post.slug}.md) — ${post.date}`)
    }
    lines.push('')
  }

  lines.push('## Optional')
  lines.push('')
  lines.push('- [Full content](https://roe.dev/llms-full.txt): Complete bio, blog index, and talks in a single document')
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
})
