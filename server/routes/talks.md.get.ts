import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(async () => {
  if (import.meta.test) {
    return mdResponse('')
  }

  const talks = await $fetch<Talk[]>('/api/talks')

  // Group talks the same way the page does
  const groupedTalks: Record<string, Talk[]> = {}
  for (const talk of talks) {
    const groupKey = talk.group?._id || talk._id
    groupedTalks[groupKey] ||= []
    groupedTalks[groupKey]!.push(talk)
  }

  const groups = Object.values(groupedTalks)
    .map(talksInGroup => talksInGroup.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    .sort((a, b) => new Date(b[0]!.date).getTime() - new Date(a[0]!.date).getTime())

  const lines = [
    mdFrontmatter('/talks', pageMeta['/talks']!),
    '',
  ]

  for (const group of groups) {
    const primary = group[0]!
    lines.push(`## ${primary.title}`)
    lines.push('')

    if (primary.description) {
      lines.push(primary.description)
      lines.push('')
    }

    if (primary.source) {
      lines.push(`- **Source:** ${primary.source}`)
    }
    lines.push(`- **Date:** ${formatDate(primary.date)}`)
    if (primary.type) {
      lines.push(`- **Type:** ${primary.type}`)
    }

    const links: string[] = []
    if (primary.video) links.push(`[Video](${primary.video})`)
    if (primary.link) links.push(`[Link](${primary.link})`)
    if (primary.slides) links.push(`[Slides](https://roe.dev/slides/${primary.slides}.pdf)`)
    if (primary.demo) links.push(`[Demo](${primary.demo})`)
    if (primary.repo) links.push(`[Repo](${primary.repo})`)
    if (links.length) {
      lines.push(`- ${links.join(' | ')}`)
    }

    // If this is a group with multiple presentations, list them
    if (group.length > 1) {
      lines.push('')
      lines.push('Also presented at:')
      for (const talk of group.slice(1)) {
        const talkLinks: string[] = []
        if (talk.video) talkLinks.push(`[Video](${talk.video})`)
        if (talk.link) talkLinks.push(`[Link](${talk.link})`)
        const suffix = talkLinks.length ? ` — ${talkLinks.join(' | ')}` : ''
        lines.push(`- ${talk.source || talk.title} (${formatDate(talk.date)})${suffix}`)
      }
    }

    lines.push('')
  }

  return mdResponse(lines.join('\n'))
})
