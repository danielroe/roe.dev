import type { H3Event } from 'h3'

import type { Talk } from '../md'
import { listRecords, blobUrl } from '../atproto'

import { toTalk, rkeyFromUri } from '#shared/cms/talk-mapper'

export async function getPastTalks (event: H3Event): Promise<Talk[]> {
  const now = new Date().toISOString()
  const [talks, groups] = await Promise.all([
    listRecords(event, 'dev.roe.talk'),
    listRecords(event, 'dev.roe.talkGroup'),
  ])

  const groupByUri = new Map(groups.map(g => [g.uri, g]))

  return talks
    .filter(t => t.value.date < now && t.value.title && t.value.title.trim() !== '')
    .map(t => {
      const groupRef = t.value.group?.uri ? groupByUri.get(t.value.group.uri) : undefined
      return toTalk(t, groupRef)
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export interface UpcomingConference {
  title?: string
  name: string
  dates: string
  endDate?: string
  link: string
  location: string
  image?: {
    url: string
    width: number
    height: number
  } | null
}

export async function getUpcomingTalks (event: H3Event): Promise<UpcomingConference[]> {
  const now = new Date().toISOString()
  const talks = await listRecords(event, 'dev.roe.talk')

  const upcoming = talks
    .filter(t => t.value.date >= now)
    .sort((a, b) => a.value.date.localeCompare(b.value.date))

  return Promise.all(upcoming.map(async t => {
    const v = t.value
    const url = v.image ? await blobUrl(event, v.image) : null
    return {
      ...(v.title ? { title: v.title } : {}),
      name: v.source || v.title || '',
      dates: v.date,
      ...(v.endDate ? { endDate: v.endDate } : {}),
      link: v.link ?? '',
      location: v.location ?? '',
      // PDS blobs don't carry intrinsic dimensions; the consumer either
      // uses <NuxtImg> with a provider that probes, or accepts 0s.
      image: url ? { url, width: 0, height: 0 } : null,
    }
  }))
}

export { rkeyFromUri }
