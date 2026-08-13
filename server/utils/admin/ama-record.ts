import type { H3Event } from 'h3'

import { jsonToLex } from '@atproto/lex'
import type { JsonValue } from '@atproto/lex'

import { requireAdminClient } from './client'
import { dev } from '#shared/lex'
import { blobSize, blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type { Loose } from '#shared/cms/strict'
import type { AdminRecord } from './crud'
import { decrypt } from './encryption'

export type AmaPlatform = 'bluesky' | 'mastodon' | 'linkedin' | 'youtubeShorts'

export interface AmaUpdate {
  question?: string
  posts?: Loose<dev.roe.ama.Post>[] | null
  platforms?: Partial<dev.roe.ama.Platforms> | null
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
  posts: Loose<dev.roe.ama.Post>[]
  platforms?: dev.roe.ama.Platforms
  publishedLinks?: dev.roe.ama.PublishedLinks
  image?: unknown
  imageDimensions?: { width: number, height: number }
  backgroundStyle?: string
  createdAt: string
  answeredAt?: string
}

const DEFAULT_PLATFORMS: dev.roe.ama.Platforms = {
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

function normalisePlatforms (platforms?: Partial<dev.roe.ama.Platforms> | null): dev.roe.ama.Platforms {
  return {
    ...DEFAULT_PLATFORMS,
    ...(platforms ?? {}),
  }
}

function cleanPosts (posts: Loose<dev.roe.ama.Post>[] | null | undefined): Loose<dev.roe.ama.Post>[] {
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

function imageFields (current: dev.roe.ama.Main, update: AmaUpdate): Partial<Loose<dev.roe.ama.Main>> {
  const image = hasOwn(update, 'image') ? update.image : current.image
  if (!image) return {}

  const dimensions = hasOwn(update, 'imageDimensions') ? update.imageDimensions : current.imageDimensions
  const backgroundStyle = hasOwn(update, 'backgroundStyle') ? update.backgroundStyle : current.backgroundStyle

  return {
    image: image as Loose<dev.roe.ama.Main>['image'],
    ...(isImageDimensions(dimensions) ? { imageDimensions: dimensions } : {}),
    ...(typeof backgroundStyle === 'string' && backgroundStyle ? { backgroundStyle } : {}),
  }
}

function hasPublishedLinks (links: dev.roe.ama.PublishedLinks | undefined): links is dev.roe.ama.PublishedLinks {
  return Boolean(links && Object.values(links).some(Boolean))
}

function buildRecord (
  current: dev.roe.ama.Main,
  update: AmaUpdate,
  published?: { platform: AmaPlatform, url: string },
): Loose<dev.roe.ama.Main> {
  const status = published || current.status === 'answered' ? 'answered' : 'unanswered'
  const posts = hasOwn(update, 'posts') ? cleanPosts(update.posts) : cleanPosts(current.posts)
  const platforms = hasOwn(update, 'platforms')
    ? (update.platforms ? normalisePlatforms(update.platforms) : undefined)
    : current.platforms
  const publishedLinks = published
    ? { ...(current.publishedLinks ?? {}), [published.platform]: published.url }
    : current.publishedLinks

  const next: Loose<dev.roe.ama.Main> = {
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

/**
 * Blob refs round-trip through the admin UI in their JSON encoding, so the
 * record has to be decoded back to lex before it can be validated or written.
 */
function toLexRecord (record: Loose<dev.roe.ama.Main>, action: string): dev.roe.ama.Main {
  const result = dev.roe.ama.main.safeValidate(jsonToLex(record as unknown as JsonValue))
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid AMA ${action}: ${result.reason.message}`,
    })
  }
  return result.value
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
): Promise<AdminRecord<typeof dev.roe.ama.main>> {
  const { client, did } = await requireAdminClient(event)
  const MAX_ATTEMPTS = 5

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const existing = await client.get(dev.roe.ama.main, { repo: did, rkey })
    const lexRecord = toLexRecord(buildRecord(existing.value, update, published), action)

    try {
      const res = await client.put(dev.roe.ama.main, lexRecord, {
        repo: did,
        rkey,
        swapRecord: existing.cid,
      })
      return {
        rkey,
        uri: res.uri,
        cid: res.cid,
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

export function viewAma (r: AdminRecord<typeof dev.roe.ama.main>): AmaView {
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
  const { client, did } = await requireAdminClient(event)
  const res = await client.get(dev.roe.ama.main, { repo: did, rkey })
  const existing = res.value.publishedLinks?.[platform]
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

  const { did } = await requireAdminClient(event)
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
