import type { H3Event } from 'h3'
import { ConflictError, cidFromBlob } from 'airspace'
import type { AirspaceRecord } from 'airspace'

import { invalidatePublicReads, requireAdminAirspace } from '../airspace'
import { decrypt } from './encryption'
import { collections } from '#shared/collections'
import type { AmaRecord } from '#shared/cms/records'
import type lexicons from '../../../lexicons.ts'

type AmaRecordEnvelope = AirspaceRecord<(typeof lexicons)['ama'], any>

export type AmaPlatform = 'bluesky' | 'mastodon' | 'linkedin' | 'youtubeShorts'

type AmaPost = NonNullable<AmaRecord['posts']>[number]
type AmaPlatforms = NonNullable<AmaRecord['platforms']>
type AmaPublishedLinks = NonNullable<AmaRecord['publishedLinks']>

export interface AmaUpdate {
  question?: string
  posts?: AmaPost[] | null
  platforms?: Partial<AmaPlatforms> | null
  image?: unknown | null
  imageDimensions?: { width: number, height: number } | null
  backgroundStyle?: string | null
}

export interface AmaView {
  rkey: string
  uri: string
  cid: string
  status: 'unanswered' | 'answered'
  question: string
  posts: AmaPost[]
  platforms?: AmaPlatforms
  publishedLinks?: AmaPublishedLinks
  image?: unknown
  imageDimensions?: { width: number, height: number }
  backgroundStyle?: string
  createdAt?: string
  answeredAt?: string
}

const DEFAULT_PLATFORMS: AmaPlatforms = {
  bluesky: true,
  mastodon: true,
  linkedin: true,
  youtubeShorts: false,
}

function hasOwn<K extends PropertyKey> (value: object, key: K): value is Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isImageDimensions (value: unknown): value is { width: number, height: number } {
  if (!value || typeof value !== 'object') return false
  const v = value as { width?: unknown, height?: unknown }
  return Number.isInteger(v.width) && Number.isInteger(v.height) && Number(v.width) > 0 && Number(v.height) > 0
}

function normalisePlatforms (platforms?: Partial<AmaPlatforms> | null): AmaPlatforms {
  return { ...DEFAULT_PLATFORMS, ...(platforms ?? {}) }
}

function cleanPosts (posts: AmaPost[] | null | undefined): AmaPost[] {
  if (!Array.isArray(posts)) return []
  return posts
    .filter(post => typeof post?.text === 'string' && post.text.trim())
    .map(post => {
      const mentions = Array.isArray(post.mentions)
        ? post.mentions
            .filter(m => typeof m?.uri === 'string' && typeof m?.cid === 'string')
            .map(m => ({ uri: m.uri, cid: m.cid }))
        : []
      return {
        text: post.text,
        ...(mentions.length ? { mentions } : {}),
      }
    })
}

function imageFields (current: AmaRecord, update: AmaUpdate): Partial<AmaRecord> {
  const image = hasOwn(update, 'image') ? update.image : current.image
  if (!image) return {}

  const dimensions = hasOwn(update, 'imageDimensions') ? update.imageDimensions : current.imageDimensions
  const backgroundStyle = hasOwn(update, 'backgroundStyle') ? update.backgroundStyle : current.backgroundStyle

  return {
    image: image as AmaRecord['image'],
    ...(isImageDimensions(dimensions) ? { imageDimensions: dimensions } : {}),
    ...(typeof backgroundStyle === 'string' && backgroundStyle ? { backgroundStyle } : {}),
  }
}

function hasPublishedLinks (links: AmaPublishedLinks | undefined): links is AmaPublishedLinks {
  return Boolean(links && Object.values(links).some(Boolean))
}

function buildRecord (
  current: AmaRecord,
  update: AmaUpdate,
  published?: { platform: AmaPlatform, url: string },
): Omit<AmaRecord, '$type'> {
  const status = published || current.status === 'answered' ? 'answered' : 'unanswered'
  const posts = hasOwn(update, 'posts') ? cleanPosts(update.posts) : cleanPosts(current.posts)
  const platforms = hasOwn(update, 'platforms')
    ? (update.platforms ? normalisePlatforms(update.platforms) : undefined)
    : current.platforms
  const publishedLinks = published
    ? { ...(current.publishedLinks ?? {}), [published.platform]: published.url }
    : current.publishedLinks

  return {
    status,
    ...(status === 'answered'
      ? { question: update.question ?? current.question ?? '' }
      : current.encryptedQuestion
        ? { encryptedQuestion: current.encryptedQuestion }
        : current.question
          ? { question: current.question }
          : {}),
    ...(posts.length ? { posts } : {}),
    ...(platforms ? { platforms } : {}),
    ...(hasPublishedLinks(publishedLinks) ? { publishedLinks } : {}),
    ...imageFields(current, update),
    createdAt: current.createdAt,
    ...(status === 'answered' ? { answeredAt: current.answeredAt ?? new Date().toISOString() } : {}),
  }
}

const MAX_ATTEMPTS = 5

/**
 * Read-modify-write guarded by the CID we read, so a concurrent publish can't
 * clobber a draft save. airspace turns a rejected swap into `ConflictError`;
 * we re-read and retry rather than surfacing it, since every caller here is
 * merging into the current value rather than replacing it.
 */
async function mutateAmaRecord (
  event: H3Event,
  rkey: string,
  update: AmaUpdate,
  action: string,
  published?: { platform: AmaPlatform, url: string },
): Promise<AmaRecordEnvelope> {
  const airspace = await requireAdminAirspace(event)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const existing = await airspace.ama.get(rkey)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: `dev.roe.ama/${rkey} not found.` })
    }

    const value = buildRecord(existing.value, update, published)

    try {
      const { uri, cid } = await airspace.ama.put(rkey, value, { ifMatch: existing.cid })
      invalidatePublicReads(collections.ama.nsid)
      return { ...existing, uri, cid, value: { ...value, $type: 'dev.roe.ama' } as AmaRecord }
    }
    catch (err) {
      if (!(err instanceof ConflictError) || attempt >= MAX_ATTEMPTS) throw err
      await new Promise(r => setTimeout(r, 50 * attempt))
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: `AMA ${action} exhausted ${MAX_ATTEMPTS} attempts for rkey=${rkey} without writing.`,
  })
}

export function viewAma (r: AmaRecordEnvelope): AmaView {
  const v = r.value
  let question = v.question ?? ''
  if (v.status === 'unanswered' && v.encryptedQuestion) {
    try {
      question = decrypt(v.encryptedQuestion)
    }
    catch (err) {
      console.warn(`[admin/ama] Failed to decrypt ${r.uri}:`, err instanceof Error ? err.message : err)
    }
  }
  return {
    rkey: r.rkey,
    uri: r.uri,
    cid: r.cid,
    status: v.status as 'unanswered' | 'answered',
    question,
    posts: v.posts ?? [],
    platforms: v.platforms,
    publishedLinks: v.publishedLinks,
    image: v.image,
    imageDimensions: v.imageDimensions,
    backgroundStyle: v.backgroundStyle,
    createdAt: v.createdAt,
    answeredAt: v.answeredAt,
  }
}

export async function saveAmaDraft (event: H3Event, rkey: string, update: AmaUpdate): Promise<AmaView> {
  return viewAma(await mutateAmaRecord(event, rkey, update, 'draft save'))
}

export async function mergePublishedLink (
  event: H3Event,
  rkey: string,
  platform: AmaPlatform,
  url: string,
  update: AmaUpdate,
): Promise<void> {
  await mutateAmaRecord(event, rkey, update, `publish link merge for ${platform}`, { platform, url })
}

export async function ensureNotAlreadyPublished (
  event: H3Event,
  rkey: string,
  platform: AmaPlatform,
  force: boolean,
): Promise<void> {
  if (force) return
  const airspace = await requireAdminAirspace(event)
  const record = await airspace.ama.get(rkey)
  const existing = record?.value.publishedLinks?.[platform]
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: `${platform} already published at ${existing}. Pass force=true to re-publish.`,
    })
  }
}

export interface AmaImage {
  blob: unknown
  url: string
  width: number
  height: number
  mimeType?: string
  size: number | null
}

export async function prepareAmaImage (
  event: H3Event,
  rkey: string,
  body: AmaUpdate,
): Promise<AmaImage | undefined> {
  if (!body.image || !body.imageDimensions) return undefined

  if (!cidFromBlob(body.image)) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid AMA image blob: ${JSON.stringify(body.image)}`,
    })
  }

  const airspace = await requireAdminAirspace(event)
  const url = await airspace.blobs.url(body.image)
  if (!url) {
    throw createError({ statusCode: 500, statusMessage: 'Could not build a blob URL for the AMA image.' })
  }

  await saveAmaDraft(event, rkey, body)

  const { mimeType, size } = body.image as { mimeType?: string, size?: number }
  return {
    blob: body.image,
    url,
    width: body.imageDimensions.width,
    height: body.imageDimensions.height,
    ...(mimeType ? { mimeType } : {}),
    size: typeof size === 'number' && Number.isFinite(size) ? size : null,
  }
}
