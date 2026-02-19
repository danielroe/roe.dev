import { rawBlogPosts } from '#md-raw-blog.json'
import { pageMeta } from '#md-page-meta.json'
import { links } from '#shared/utils/links'

export default defineEventHandler(async () => {
  if (import.meta.test) {
    return mdResponse('')
  }

  const [talks, upcomingConferences] = await Promise.all([
    $fetch<Talk[]>('/api/talks').catch(() => [] as Talk[]),
    $fetch<Conference[]>('/api/upcoming-conferences').catch(() => [] as Conference[]),
  ])

  // Group talks and take top 4
  const groupedTalks: Record<string, Talk[]> = {}
  for (const talk of talks) {
    const groupKey = talk.group?._id || talk._id
    groupedTalks[groupKey] ||= []
    groupedTalks[groupKey]!.push(talk)
  }
  const recentTalks = Object.values(groupedTalks)
    .map(g => g.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]!)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  const recentPosts = rawBlogPosts.slice(0, 4)

  const lines = [
    mdFrontmatter('/', pageMeta['/']!),
    '',
    'I am an open source maintainer and founder, leading the [Nuxt core team](https://nuxt.com). Previously, I was CTO of a SaaS startup and founder of a creative agency focusing on clarity of vision and message.',
    '',
    '[More about Daniel](https://roe.dev/bio.md)',
    '',
    '## Links',
    '',
    ...links
      .filter(l => l.link.startsWith('https://'))
      .map(l => `- [${l.name}](${l.link})`),
    '- [Email](mailto:daniel@roe.dev)',
    '',
  ]

  if (upcomingConferences.length) {
    lines.push('## Upcoming Conferences')
    lines.push('')
    for (const conf of upcomingConferences) {
      const link = conf.link ? `[${conf.name}](${conf.link})` : conf.name
      lines.push(`- ${link} — ${conf.dates}${conf.location ? ` (${conf.location})` : ''}`)
    }
    lines.push('')
  }

  if (recentTalks.length) {
    lines.push('## Recent Talks')
    lines.push('')
    for (const talk of recentTalks) {
      const talkLinks: string[] = []
      if (talk.video) talkLinks.push(`[Video](${talk.video})`)
      if (talk.link) talkLinks.push(`[Link](${talk.link})`)
      const suffix = talkLinks.length ? ` — ${talkLinks.join(', ')}` : ''
      lines.push(`- ${talk.title} (${formatDate(talk.date)})${suffix}`)
    }
    lines.push('')
    lines.push('[More talks](https://roe.dev/talks.md)')
    lines.push('')
  }

  if (recentPosts.length) {
    lines.push('## Latest from the Blog')
    lines.push('')
    for (const post of recentPosts) {
      lines.push(`- [${post.title}](https://roe.dev/blog/${post.slug}.md) — ${post.date}`)
    }
    lines.push('')
    lines.push('[More articles](https://roe.dev/blog.md)')
    lines.push('')
  }

  lines.push('## Contact')
  lines.push('')
  lines.push('I\'d love to connect on social media or [by email](mailto:daniel@roe.dev). I have an open diary if you want to [book a meeting](https://roe.dev/blog/open-invitation.md).')
  lines.push('')
  lines.push('## Sponsors')
  lines.push('')
  lines.push('My open source work is supported by sponsors. [More about how I\'m funded](https://roe.dev/blog/funding.md).')
  lines.push('')

  return mdResponse(lines.join('\n'))
})
