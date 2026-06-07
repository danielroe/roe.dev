import type { H3Event } from 'h3'

import { requireAdminAgent } from './agent'
import type { DevRoeAma } from '#shared/lex'
import { lexicons } from '#shared/lex'
import { jsonToLex } from '@atproto/lexicon'
import { blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type { AdminRecord } from './crud'
import { decrypt } from './encryption'

export type AmaPlatform = 'bluesky' | 'mastodon' | 'linkedin' | 'youtubeShorts'

export interface AmaUpdate {
  question?: string
  posts?: DevRoeAma.Post[]
  platforms?: DevRoeAma.Platforms
  image?: unknown
  imageDimensions?: { width: number, height: number }
  backgroundStyle?: string
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

// Decrypts the question for unanswered AMAs; falls back to the public
// question field once answered.
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

/**
 * Read-modify-write helper for publish endpoints. Platforms publish in
 * parallel, so we CAS via `swapRecord` against the last-read CID and
 * retry on conflict rather than stomping concurrent writers.
 */
export async function mergePublishedLink (
  event: H3Event,
  rkey: string,
  platform: AmaPlatform,
  url: string,
  update: AmaUpdate,
): Promise<void> {
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

    const next: DevRoeAma.Record = {
      $type: 'dev.roe.ama',
      status: 'answered',
      question: update.question ?? current.question,
      posts: update.posts ?? current.posts ?? [],
      platforms: update.platforms ?? current.platforms ?? {
        bluesky: false,
        mastodon: false,
        linkedin: false,
        youtubeShorts: false,
      },
      publishedLinks: {
        ...(current.publishedLinks ?? {}),
        [platform]: url,
      },
      ...(update.image
        ? {
            image: update.image as never,
            ...(update.imageDimensions ? { imageDimensions: update.imageDimensions } : {}),
            ...(update.backgroundStyle ? { backgroundStyle: update.backgroundStyle } : {}),
          }
        : current.image
          ? {
              image: current.image,
              ...(current.imageDimensions ? { imageDimensions: current.imageDimensions } : {}),
              ...(current.backgroundStyle ? { backgroundStyle: current.backgroundStyle } : {}),
            }
          : {}),
      createdAt: current.createdAt,
      answeredAt: current.answeredAt ?? new Date().toISOString(),
    }

    const lexRecord = jsonToLex(next as never) as DevRoeAma.Record
    const validation = lexicons.validate('dev.roe.ama', lexRecord)
    if (!validation.success) {
      throw createError({
        statusCode: 422,
        statusMessage: `dev.roe.ama record failed validation: ${validation.error.message}`,
      })
    }

    try {
      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'dev.roe.ama',
        rkey,
        record: lexRecord as Record<string, unknown>,
        swapRecord: currentCid,
      })
      return
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const looksLikeSwapMiss = /swap|cid|conflict|InvalidSwap/i.test(msg)
      if (!looksLikeSwapMiss || attempt >= MAX_ATTEMPTS) throw err
      await new Promise(r => setTimeout(r, 50 * attempt))
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: `mergePublishedLink exhausted ${MAX_ATTEMPTS} attempts for ${platform} on rkey=${rkey} without writing.`,
  })
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

export function publishImageFromBody (
  event: H3Event,
  body: AmaUpdate,
): { url: string, width: number, height: number, mimeType?: string } | undefined {
  if (!body.image || !body.imageDimensions) return undefined
  const cid = cidFromBlob(body.image)
  const config = useRuntimeConfig(event)
  const did = config.atproto.did
  if (!cid || !did) return undefined
  const mimeType = (body.image as { mimeType?: string } | undefined)?.mimeType
  return {
    url: blobUrlFor(config.atproto.service, did, cid),
    width: body.imageDimensions.width,
    height: body.imageDimensions.height,
    ...(mimeType ? { mimeType } : {}),
  }
}
