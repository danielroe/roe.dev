import type { H3Event } from 'h3'

import { requireAdminAgent } from './agent'
import type { DevRoeAma } from '#shared/lex'
import { lexicons } from '#shared/lex'
import { jsonToLex } from '@atproto/lexicon'
import { blobSize, blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type { AdminRecord } from './crud'
import { decrypt } from './encryption'

export type AmaPlatform = 'bluesky' | 'mastodon' | 'linkedin' | 'youtubeShorts'

export interface AmaUpdate {
  question?: string
  posts?: DevRoeAma.Post[] | null
  platforms?: Partial<DevRoeAma.Platforms> | null
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
  posts: DevRoeAma.Post[]
  platforms?: DevRoeAma.Platforms
  publishedLinks?: DevRoeAma.PublishedLinks
  image?: unknown
  imageDimensions?: { width: number, height: number }
  backgroundStyle?: string
  createdAt: string
  answeredAt?: string
}

const DEFAULT_PLATFORMS: DevRoeAma.Platforms = {
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

function normalisePlatforms (platforms?: Partial<DevRoeAma.Platforms> | null): DevRoeAma.Platforms {
  return {
    ...DEFAULT_PLATFORMS,
    ...(platforms ?? {}),
  }
}

function cleanPosts (posts: DevRoeAma.Post[] | null | undefined): DevRoeAma.Post[] {
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

function imageFields (current: DevRoeAma.Record, update: AmaUpdate): Partial<DevRoeAma.Record> {
  const image = hasOwn(update, 'image') ? update.image : current.image
  if (!image) return {}

  const dimensions = hasOwn(update, 'imageDimensions') ? update.imageDimensions : current.imageDimensions
  const backgroundStyle = hasOwn(update, 'backgroundStyle') ? update.backgroundStyle : current.backgroundStyle

  return {
    image: image as DevRoeAma.Record['image'],
    ...(isImageDimensions(dimensions) ? { imageDimensions: dimensions } : {}),
    ...(typeof backgroundStyle === 'string' && backgroundStyle ? { backgroundStyle } : {}),
  }
}

function hasPublishedLinks (links: DevRoeAma.PublishedLinks | undefined): links is DevRoeAma.PublishedLinks {
  return Boolean(links && Object.values(links).some(Boolean))
}

function buildRecord (
  current: DevRoeAma.Record,
  update: AmaUpdate,
  published?: { platform: AmaPlatform, url: string },
): DevRoeAma.Record {
  const status = published || current.status === 'answered' ? 'answered' : 'unanswered'
  const posts = hasOwn(update, 'posts') ? cleanPosts(update.posts as DevRoeAma.Post[] | null | undefined) : cleanPosts(current.posts)
  const platforms = hasOwn(update, 'platforms')
    ? (update.platforms ? normalisePlatforms(update.platforms) : undefined)
    : current.platforms
  const publishedLinks = published
    ? { ...(current.publishedLinks ?? {}), [published.platform]: published.url }
    : current.publishedLinks

  const next: DevRoeAma.Record = {
    $type: 'dev.roe.ama',
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

  return next
}

function toLexRecord (record: DevRoeAma.Record, action: string): DevRoeAma.Record {
  const lexRecord = jsonToLex(record as never) as DevRoeAma.Record
  const validation = lexicons.validate('dev.roe.ama', lexRecord)
  if (!validation.success) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid AMA ${action}: ${validation.error.message}`,
    })
  }
  return lexRecord
}

function looksLikeSwapMiss (err: unknown): boolean {
  const e = err as { error?: string, name?: string, status?: number, message?: string } | undefined
  return e?.error === 'InvalidSwap'
    || e?.name === 'InvalidSwapError'
    || /invalidswap|swap|record was at/i.test(e?.message ?? '')
}

async function mutateAmaRecord (
  event: H3Event,
  rkey: string,
  update: AmaUpdate,
  action: string,
  published?: { platform: AmaPlatform, url: string },
): Promise<AdminRecord<'dev.roe.ama'>> {
  const { agent, did } = await requireAdminAgent(event)
  const MAX_ATTEMPTS = 5

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const existing = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: 'dev.roe.ama',
      rkey,
    })
    const current = existing.data.value as DevRoeAma.Record
    const currentCid = existing.data.cid
    const lexRecord = toLexRecord(buildRecord(current, update, published), action)

    try {
      const res = await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'dev.roe.ama',
        rkey,
        record: lexRecord as Record<string, unknown>,
        swapRecord: currentCid,
      })
      return {
        rkey,
        uri: res.data.uri,
        cid: res.data.cid,
        value: lexRecord,
      }
    }
    catch (err) {
      if (!looksLikeSwapMiss(err) || attempt >= MAX_ATTEMPTS) throw err
      await new Promise(r => setTimeout(r, 50 * attempt))
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: `AMA ${action} exhausted ${MAX_ATTEMPTS} attempts for rkey=${rkey} without writing.`,
  })
}

export function viewAma (r: AdminRecord<'dev.roe.ama'>): AmaView {
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

export async function saveAmaDraft (
  event: H3Event,
  rkey: string,
  update: AmaUpdate,
): Promise<AmaView> {
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
  const { agent, did } = await requireAdminAgent(event)
  const res = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: 'dev.roe.ama',
    rkey,
  })
  const existing = (res.data.value as DevRoeAma.Record).publishedLinks?.[platform]
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

  const cid = cidFromBlob(body.image)
  if (!cid) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid AMA image blob.' })
  }

  const service = useRuntimeConfig(event).public.atproto.service
  if (!service) {
    throw createError({ statusCode: 500, statusMessage: 'PDS service is not configured.' })
  }

  const { did } = await requireAdminAgent(event)
  await saveAmaDraft(event, rkey, body)

  const mimeType = (body.image as { mimeType?: string } | undefined)?.mimeType
  return {
    blob: body.image,
    url: blobUrlFor(service, did, cid),
    width: body.imageDimensions.width,
    height: body.imageDimensions.height,
    ...(mimeType ? { mimeType } : {}),
    size: blobSize(body.image),
  }
}
