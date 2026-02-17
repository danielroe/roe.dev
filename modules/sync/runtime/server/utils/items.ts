import type { SyncItem } from '../providers'

const talkMap: Record<string, SyncItem['type']> = {
  podcast: 'video',
  talk: 'talk',
  meetup: 'talk',
  conference: 'talk',
  stream: 'video',
  workshop: 'talk',
}

export async function getTalks () {
  const items: SyncItem[] = []

  try {
    const talks = await $fetch('/api/talks')

    for (const talk of talks) {
      const link = talk.link || talk.video
      // Only sync talks that have a link/video
      if (!link) {
        continue
      }

      items.push({
        type: talkMap[talk.type] || 'talk',
        title: talk.title,
        date: talk.date,
        body_markdown: talk.description || '',
        canonical_url: link,
        tags: Array.isArray(talk.tags) ? talk.tags : [],
      })
    }
  }
  catch (error) {
    console.warn('Failed to fetch talks from CMS for sync, skipping:', error)
  }

  return items
}
