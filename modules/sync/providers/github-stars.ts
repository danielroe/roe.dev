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
      baseURL: 'https://api-stars.github.com/',
      headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${token}` },
    })

    const existing = await $stars<{
      data: {
        contributions: Array<{
          id: string
          url: string
          title: string
          type: string
          date: string
          description: string
        }>
      }
    }>('', {
      method: 'POST',
      body: { query: `query { contributions { id url title type date description } }` },
    })

    const existingByUrl = new Map(
      (existing.data?.contributions || []).map(c => [c.url, c]),
    )

    const toCreate: Array<{ type: string, title: string, description: string, url: string, date: string }> = []
    const toUpdate: Array<{ id: string, data: { type: string, title: string, description: string, url: string, date: string } }> = []

    for (const item of eligible) {
      const input = {
        type: CONTRIBUTION_TYPE_MAP[item.type] || 'OTHER',
        title: item.title,
        description: item.description || '',
        url: item.canonical_url,
        date: item.date!,
      }

      const match = existingByUrl.get(item.canonical_url)
      if (!match) {
        toCreate.push(input)
      }
      else if (
        match.title !== input.title
        || match.type !== input.type
        || match.date !== input.date
        || (match.description || '') !== input.description
      ) {
        toUpdate.push({ id: match.id, data: input })
      }
    }

    let created = 0
    let updated = 0

    if (toCreate.length) {
      const response = await $stars<{ data: { createContributions: Array<unknown> } }>('', {
        method: 'POST',
        body: {
          query: `mutation createContributions($data: [ContributionInput!]!) { createContributions(data: $data) { type title url description date } }`,
          variables: { data: toCreate },
        },
      })
      created = response.data?.createContributions?.length || 0
    }

    for (const { id, data } of toUpdate) {
      await $stars('', {
        method: 'POST',
        body: {
          query: `mutation updateContribution($id: String!, $data: ContributionInput!) { updateContribution(id: $id, data: $data) { id } }`,
          variables: { id, data },
        },
      })
      updated++
    }

    console.info(`[sync:github-stars] Done: ${created} created, ${updated} updated`)
  }
}
