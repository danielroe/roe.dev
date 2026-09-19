import { $fetch } from 'ofetch'

import type { SyncItem, SyncOptions, SyncProvider } from './index'

const CONTRIBUTION_TYPE_MAP: Record<SyncItem['type'], string> = {
  blog: 'BLOGPOST',
  talk: 'SPEAKING',
  article: 'ARTICLE_PUBLICATION',
  event: 'EVENT_ORGANIZATION',
  hackathon: 'HACKATHON',
  oss: 'OPEN_SOURCE_PROJECT',
  video: 'VIDEO_PODCAST',
  forum: 'FORUM',
  other: 'OTHER',
}

interface Contribution {
  id: string
  externalId?: string
  url: string
  title: string
  type: string
  date: string
  description?: string
}

interface ContributionInput {
  type: string
  title: string
  description: string
  url: string
  date: string
}

/**
 * Client-supplied stable ID for a contribution. The API accepts 1-255
 * characters of letters, numbers, periods, underscores, hyphens or colons.
 */
function externalId (url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^\w.:-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 255)
}

function description (item: SyncItem): string {
  const text = (item.description || item.body_markdown || item.title).trim()
  return text.length > 500 ? `${text.slice(0, 499).trimEnd()}…` : text
}

export class GithubStarsProvider implements SyncProvider {
  name = 'github-stars'

  async sync (items: SyncItem[], { dryRun }: SyncOptions): Promise<void> {
    const eligible = items.filter(i => i.canonical_url && i.date)
    if (!eligible.length) return

    if (dryRun) {
      console.info(`[sync:github-stars] Would sync ${eligible.length} items`)
      for (const item of eligible) {
        console.info(`[sync:github-stars]   ${CONTRIBUTION_TYPE_MAP[item.type] || 'OTHER'}: ${item.title}`)
      }
      return
    }

    const token = process.env.NUXT_GITHUB_STARS_TOKEN
    if (!token) throw new Error('No NUXT_GITHUB_STARS_TOKEN provided.')

    const $stars = $fetch.create({
      baseURL: 'https://stars.github.com/api/',
      headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${token}` },
    })

    const existing: Contribution[] = []
    let page = 1
    let totalPages: number
    do {
      const response = await $stars<{
        data: Contribution[]
        pagination?: { page: number, limit: number, total: number, totalPages: number }
      }>('contributions', { query: { page } })
      existing.push(...(response.data || []))
      totalPages = response.pagination?.totalPages ?? 1
      page++
    } while (page <= totalPages)

    const existingByUrl = new Map(existing.map(c => [c.url, c]))

    const changed: Array<{ id: string, data: ContributionInput }> = []

    for (const item of eligible) {
      const data: ContributionInput = {
        type: CONTRIBUTION_TYPE_MAP[item.type] || 'OTHER',
        title: item.title,
        description: description(item),
        url: item.canonical_url,
        date: item.date!,
      }

      const match = existingByUrl.get(item.canonical_url)
      if (
        !match
        || match.title !== data.title
        || match.type !== data.type
        || match.date !== data.date
        || (match.description || '') !== data.description
        || !match.description
      ) {
        changed.push({ id: match?.externalId || externalId(item.canonical_url), data })
      }
    }

    let synced = 0
    for (const { id, data } of changed) {
      try {
        await $stars(`contributions/${encodeURIComponent(id)}`, { method: 'PUT', body: data })
        synced++
      }
      catch (error) {
        const message = (error as { data?: { message?: string } }).data?.message
        console.warn(`[sync:github-stars] ${data.url}: ${message || (error instanceof Error ? error.message : error)}`)
      }
    }

    console.info(`[sync:github-stars] Done: ${synced} of ${changed.length} created or updated`)
  }
}
