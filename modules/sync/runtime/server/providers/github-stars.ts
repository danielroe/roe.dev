import type { SyncItem, SyncProvider } from './index'

export class GithubStarsProvider implements SyncProvider {
  name = 'github-stars'

  async sync (items: SyncItem[]): Promise<{ status: string, count: number, total: number }> {
    const token = useRuntimeConfig().github.starsToken
    if (!token) throw new Error('No NUXT_GITHUB_STARS_TOKEN provided.')

    const $stars = $fetch.create({
      baseURL: 'https://api-stars.github.com/',
      headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${token}` },
    })

    // Fetch existing contributions
    const existing = await $stars<{ data: { contributions: Array<{ id: string, url: string, title: string, type: string, date: string, description: string }> } }>(
      '',
      {
        method: 'POST',
        body: {
          query: `query { contributions { id url title type date description } }`,
        },
      },
    )
    const existingByUrl = new Map(
      (existing.data?.contributions || []).map(c => [c.url, c]),
    )

    // Prepare new and updated items
    const toCreate = []
    const toUpdate = []
    for (const item of items) {
      if (!item.canonical_url || !item.date) {
        continue
      }
      const mappedType = mapSyncItemTypeToContributionType(item.type)
      const existing = existingByUrl.get(item.canonical_url)
      const input = {
        type: mappedType,
        title: item.title,
        description: item.description || '',
        url: item.canonical_url,
        date: item.date,
      }
      if (!existing) {
        toCreate.push(input)
      }
      else {
        // Check if any field has changed
        if (
          existing.title !== input.title
          || existing.type !== input.type
          || existing.date !== input.date
          || (existing.description || '') !== input.description
        ) {
          toUpdate.push({ id: existing.id, data: input })
        }
      }
    }

    let created = 0
    let updated = 0
    if (toCreate.length) {
      const response = await $stars<{ data: { createContributions: Array<any> } }>(
        '',
        {
          method: 'POST',
          body: {
            query: `mutation createContributions($data: [ContributionInput!]!) { createContributions(data: $data) { type title url description date } }`,
            variables: { data: toCreate },
          },
        },
      )
      created = response.data?.createContributions?.length || 0
    }
    if (toUpdate.length) {
      for (const { id, data } of toUpdate) {
        const res = await $stars<{ data: { updateContribution: any } }>(
          '',
          {
            method: 'POST',
            body: {
              query: `mutation updateContribution($id: String!, $data: ContributionInput!) { updateContribution(id: $id, data: $data) { id } }`,
              variables: { id, data },
            },
          },
        )
        console.log(res, 'updated', data.title)
        updated++
      }
    }
    return {
      status: created || updated ? 'ok' : 'noop',
      count: created + updated,
      total: items.length,
    }
  }
}

function mapSyncItemTypeToContributionType (type: SyncItem['type']): string {
  switch (type) {
    case 'blog':
      return 'BLOGPOST'
    case 'talk':
      return 'SPEAKING'
    case 'article':
      return 'ARTICLE_PUBLICATION'
    case 'event':
      return 'EVENT_ORGANIZATION'
    case 'hackathon':
      return 'HACKATHON'
    case 'oss':
      return 'OPEN_SOURCE_PROJECT'
    case 'video':
      return 'VIDEO_PODCAST'
    case 'forum':
      return 'FORUM'
    case 'other':
    default:
      return 'OTHER'
  }
}
