import { rawBlogPosts } from '#md-raw-blog.json'
import { rawPages } from '#md-raw-pages.json'
import { links } from '#shared/utils/links'

export default defineEventHandler(async () => {
  if (import.meta.test) {
    return new Response('', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const [talks, upcomingConferences] = await Promise.all([
    $fetch<Talk[]>('/api/talks').catch(() => [] as Talk[]),
    $fetch<Conference[]>('/api/upcoming-conferences').catch(() => [] as Conference[]),
  ])

  const lines = [
    '# Daniel Roe',
    '',
    '> Nuxt core team lead, open source maintainer, and keynote speaker. Part of the team at Vercel. Based in Scotland.',
    '',
    '---',
    '',
    '## Bio',
    '',
    rawPages['bio'] || '',
    '',
    '---',
    '',
    '## AI Policy',
    '',
    rawPages['ai'] || '',
    '',
    '---',
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
    lines.push('---')
    lines.push('')
  }

  // Group talks and list them
  if (talks.length) {
    const groupedTalks: Record<string, Talk[]> = {}
    for (const talk of talks) {
      const groupKey = talk.group?._id || talk._id
      groupedTalks[groupKey] ||= []
      groupedTalks[groupKey]!.push(talk)
    }
    const talkSeries = Object.values(groupedTalks)
      .map(g => g.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]!)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    lines.push('## Talks')
    lines.push('')
    for (const talk of talkSeries) {
      const talkLinks: string[] = []
      if (talk.video) talkLinks.push(`[Video](${talk.video})`)
      if (talk.link) talkLinks.push(`[Link](${talk.link})`)
      const suffix = talkLinks.length ? ` — ${talkLinks.join(', ')}` : ''
      lines.push(`- ${talk.title} (${formatDate(talk.date)}, ${talk.source})${suffix}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // All blog posts with descriptions
  lines.push('## Blog Posts')
  lines.push('')
  for (const post of rawBlogPosts) {
    lines.push(`### ${post.title}`)
    lines.push('')
    lines.push(`- **Date:** ${post.date}`)
    lines.push(`- **URL:** https://roe.dev/blog/${post.slug}.md`)
    if (post.tags.length) {
      lines.push(`- **Tags:** ${post.tags.join(', ')}`)
    }
    if (post.description) {
      lines.push('')
      lines.push(post.description)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('## Contact')
  lines.push('')
  lines.push('- Email: daniel@roe.dev')
  for (const l of links.filter(l => l.link.startsWith('https://'))) {
    lines.push(`- ${l.name}: ${l.link}`)
  }
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
})
