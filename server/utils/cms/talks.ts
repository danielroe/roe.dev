import type { H3Event } from 'h3'

import type { Talk } from '../md'
import { useAirspace } from '../airspace'
import { toTalk, rkeyFromUri } from '#shared/cms/talk-mapper'

export async function getPastTalks (event: H3Event): Promise<Talk[]> {
  const now = new Date().toISOString()
  const airspace = useAirspace(event)
  const [talks, groups] = await Promise.all([
    airspace.talks.list(),
    airspace.talkGroups.list(),
  ])

  const groupByUri = new Map(groups.map(g => [g.uri as string, g]))

  return talks
    .filter(t => t.value.date < now && t.value.title && t.value.title.trim() !== '')
    .map(t => toTalk(t, t.value.group?.uri ? groupByUri.get(t.value.group.uri) : undefined))
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
    alt: string
    width: number
    height: number
  } | null
}

export async function getUpcomingTalks (event: H3Event): Promise<UpcomingConference[]> {
  const now = new Date().toISOString()
  const airspace = useAirspace(event)
  const talks = await airspace.talks.list()

  const upcoming = talks
    .filter(t => t.value.date >= now)
    .sort((a, b) => a.value.date.localeCompare(b.value.date))

  return await Promise.all(upcoming.map(async t => {
    const v = t.value
    const image = await airspace.blobs.image(v.image)
    return {
      ...(v.title ? { title: v.title } : {}),
      name: v.source || v.title || '',
      dates: v.date,
      ...(v.endDate ? { endDate: v.endDate } : {}),
      link: v.link ?? '',
      location: v.location ?? '',
      image: image && { url: image.url, alt: image.alt, width: image.width ?? 0, height: image.height ?? 0 },
    }
  }))
}

export { rkeyFromUri }
