import type { H3Event } from 'h3'

import type { Talk } from '../md'
import { listRecords, blobImage } from '../atproto'
import { dev } from '#shared/lex'

import { toTalk, rkeyFromUri } from '#shared/cms/talk-mapper'

export async function getPastTalks (event: H3Event): Promise<Talk[]> {
  const now = new Date().toISOString()
  const [talks, groups] = await Promise.all([
    listRecords(event, dev.roe.talk.main),
    listRecords(event, dev.roe.talkGroup.main),
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
    alt: string
    width: number
    height: number
  } | null
}

export async function getUpcomingTalks (event: H3Event): Promise<UpcomingConference[]> {
  const now = new Date().toISOString()
  const talks = await listRecords(event, dev.roe.talk.main)

  const upcoming = talks
    .filter(t => t.value.date >= now)
    .sort((a, b) => a.value.date.localeCompare(b.value.date))

  return Promise.all(upcoming.map(async t => {
    const v = t.value
    const image = await talkImage(event, v)
    return {
      ...(v.title ? { title: v.title } : {}),
      name: v.source || v.title || '',
      dates: v.date,
      ...(v.endDate ? { endDate: v.endDate } : {}),
      link: v.link ?? '',
      location: v.location ?? '',
      image,
    }
  }))
}

/**
 * `community.lexicon.app.defs#image` allows either an uploaded blob or a remote
 * `uri`; render whichever the record carries.
 */
async function talkImage (event: H3Event, value: dev.roe.talk.Main): Promise<UpcomingConference['image']> {
  const image = value.image
  if (!image) return null

  if (image.image) {
    const blob = await blobImage(event, image.image, image.aspectRatio)
    return blob ? { url: blob.url, alt: image.alt, width: blob.width ?? 0, height: blob.height ?? 0 } : null
  }

  if (!image.uri) return null
  return {
    url: image.uri,
    alt: image.alt,
    width: image.aspectRatio?.width ?? 0,
    height: image.aspectRatio?.height ?? 0,
  }
}

export { rkeyFromUri }
