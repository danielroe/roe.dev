import fsp from 'node:fs/promises'
import { globby } from 'globby'
import { serializers } from '../../../shared/serialisers'
import talks from '../../../../app/data/talks.json'
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
    const date = contents.match(/date: ['"]?(?<date>.*[^"'\n])/)?.groups?.date?.trim()
    const title = contents.match(/title: ['"]?(?<title>.*[^"'\n])/)?.groups?.title?.trim() || 'Untitled'
    for (const item of serializers) {
      contents = contents.replace(item[0], item[1])
    }
    const slug = file.match(/\/([^/]*)$/)?.[1]?.replace(/\.md$/, '') || ''
    const firstParagraph = contents.split(/\n\s*\n/).find(p => p.trim())?.trim() || ''
    articles.push({
      type: 'blog' as const,
      title,
      date,
      description: firstParagraph || '',
      body_markdown: contents,
      canonical_url: `https://roe.dev/blog/${slug}/`,
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
}

export async function getTalks () {
  const items: SyncItem[] = []
  for (const talk of talks) {
    const link = talk.link || talk.video
    if (!link) {
      continue
    }
    items.push({
      type: talkMap[talk.type] || 'talk',
      title: talk.title,
      date: talk.date,
      body_markdown: talk.description || '',
      canonical_url: link,
    })
  }
  return items
}
