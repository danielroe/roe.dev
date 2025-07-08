import fsp from 'node:fs/promises'
import { globby } from 'globby'
import matter from 'gray-matter'
import { serializers } from '../../../../shared/serialisers'
import type { SyncItem } from '../providers'

export async function getMarkdownArticles (): Promise<SyncItem[]> {
  const rootDir = process.cwd()
  const articles: SyncItem[] = []
  const files = await globby('./content/blog/**/*.md', {
    cwd: rootDir,
    absolute: true,
  })
  for (const file of files) {
    let contents = await fsp.readFile(file, 'utf-8')
    if (contents.includes('skip_dev')) continue
    const { data, content } = matter(contents)
    const date = typeof data.date === 'string' ? data.date.trim() : (data.date instanceof Date ? data.date.toISOString().slice(0, 10) : undefined)
    const title = data.title?.toString().trim() || 'Untitled'
    for (const item of serializers) {
      contents = contents.replace(item[0], item[1])
    }
    const slug = file.match(/\/([^/]*)$/)?.[1]?.replace(/\.md$/, '') || ''
    const firstParagraph = content.split(/\n\s*\n/).find(p => p.trim())?.trim() || ''
    let tags: string[] = []
    if (Array.isArray(data.tags)) {
      tags = data.tags.map((t: any) => t.toString().trim())
    }
    else if (typeof data.tags === 'string') {
      tags = data.tags.split(',').map((t: string) => t.trim())
    }
    articles.push({
      type: 'blog' as const,
      title,
      date,
      description: firstParagraph || '',
      body_markdown: content,
      canonical_url: `https://roe.dev/blog/${slug}/`,
      tags: tags.length ? tags : undefined,
    })
    if (!date) {
      console.warn(`Article "${title}" in ${file} has no date set. Please add a date to the frontmatter.`)
    }
  }
  return articles
}

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
