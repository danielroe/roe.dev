import type { H3Event } from 'h3'
import { AtpAgent } from '@atproto/api'

import { lexicons } from '#shared/lex'
import { blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type {
  DevRoeAma,
  DevRoeEntity,
  DevRoeInvite,
  DevRoeLocation,
  DevRoeSync,
  DevRoeTalk,
  DevRoeTalkGroup,
  DevRoeUsesCategory,
  DevRoeUsesItem,
} from '#shared/lex'

/**
 * Reads against our own PDS don't need auth - `com.atproto.repo.listRecords`
 * and `getRecord` are open against any public repo. We use an unauthed
 * agent for reads to dodge the PDS's per-account login rate limit, and only
 * `login()` on write paths.
 *
 * Both agents are cached per Nitro process.
 */
let readAgent: AtpAgent | null = null
let authedAgent: { agent: AtpAgent, did: string } | null = null

function getReadAgent (event: H3Event): AtpAgent {
  if (readAgent) return readAgent
  const config = useRuntimeConfig(event)
  readAgent = new AtpAgent({ service: config.atproto.service })
  return readAgent
}

async function getAuthedAgent (event: H3Event): Promise<{ agent: AtpAgent, did: string }> {
  if (authedAgent) return authedAgent

  const config = useRuntimeConfig(event)
  const { service, handle, password } = config.atproto

  if (!service || !handle || !password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'atproto credentials are not configured (NUXT_ATPROTO_*).',
    })
  }

  const agent = new AtpAgent({ service })
  await agent.login({ identifier: handle, password })

  if (!agent.session) {
    throw createError({ statusCode: 500, statusMessage: 'atproto login did not return a session.' })
  }

  authedAgent = { agent, did: agent.session.did }
  return authedAgent
}

let didPromise: Promise<string> | null = null

/**
 * Resolve our PDS DID. The build-time `modules/atproto` module populates
 * `runtimeConfig.atproto.did` from the configured handle; if we've already
 * logged in we prefer the session DID. Cached for the lifetime of the process.
 */
export async function resolveDid (event: H3Event): Promise<string> {
  if (authedAgent) return authedAgent.did
  if (didPromise) return didPromise

  const config = useRuntimeConfig(event)

  if (!config.atproto.did) {
    throw createError({
      statusCode: 500,
      statusMessage: 'runtimeConfig.atproto.did is not set; the build-time atproto module did not resolve it.',
    })
  }

  didPromise = Promise.resolve(config.atproto.did)
  return didPromise
}

/** Map from NSID to its record interface. Extend as new lexicons are added. */
export interface RecordTypes {
  'dev.roe.talk': DevRoeTalk.Record
  'dev.roe.talkGroup': DevRoeTalkGroup.Record
  'dev.roe.usesCategory': DevRoeUsesCategory.Record
  'dev.roe.usesItem': DevRoeUsesItem.Record
  'dev.roe.location': DevRoeLocation.Record
  'dev.roe.entity': DevRoeEntity.Record
  'dev.roe.invite': DevRoeInvite.Record
  'dev.roe.ama': DevRoeAma.Record
  'dev.roe.sync': DevRoeSync.Record
}

export type Collection = keyof RecordTypes

/** A record as returned by listRecords, with strongly typed `value`. */
export interface FetchedRecord<C extends Collection> {
  uri: string
  cid: string
  value: RecordTypes[C]
}

/**
 * Put (create or overwrite) a record at a known rkey. Validates against the
 * lexicon before sending, so we fail fast on schema drift in dev.
 */
export async function putRecord<C extends Collection> (
  event: H3Event,
  collection: C,
  rkey: string,
  value: Omit<RecordTypes[C], '$type'>,
): Promise<{ uri: string, cid: string }> {
  const { agent, did } = await getAuthedAgent(event)

  const record = { $type: collection, ...value } as RecordTypes[C]
  const result = lexicons.validate(collection, record)
  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: `Record failed lexicon validation for ${collection}: ${result.error.message}`,
    })
  }

  const res = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection,
    rkey,
    record,
  })
  return { uri: res.data.uri, cid: res.data.cid }
}

/** Get a single record by rkey. Returns null if it doesn't exist. */
export async function getRecord<C extends Collection> (
  event: H3Event,
  collection: C,
  rkey: string,
): Promise<FetchedRecord<C> | null> {
  const did = await resolveDid(event)
  const agent = getReadAgent(event)
  try {
    const res = await agent.com.atproto.repo.getRecord({ repo: did, collection, rkey })
    return {
      uri: res.data.uri,
      cid: res.data.cid ?? '',
      value: res.data.value as RecordTypes[C],
    }
  }
  catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

/** List all records in a collection, paginating until exhausted. */
export async function listRecords<C extends Collection> (
  event: H3Event,
  collection: C,
  options: { limit?: number, reverse?: boolean } = {},
): Promise<FetchedRecord<C>[]> {
  const did = await resolveDid(event)
  const agent = getReadAgent(event)
  const pageSize = 100
  const records: FetchedRecord<C>[] = []
  let cursor: string | undefined

  while (true) {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection,
      limit: pageSize,
      cursor,
      reverse: options.reverse,
    })
    for (const r of res.data.records) {
      records.push({ uri: r.uri, cid: r.cid, value: r.value as RecordTypes[C] })
      if (options.limit && records.length >= options.limit) return records
    }
    if (!res.data.cursor || res.data.records.length < pageSize) break
    cursor = res.data.cursor
  }

  return records
}

/**
 * Resolve a blob ref to `{ url, width, height }`. Dimensions are taken
 * from the record's `aspectRatio` sibling; the read path does not probe
 * blob bytes. A missing `aspectRatio` on a record with an `image` is a
 * write-path bug, not a read-time concern.
 */
export interface BlobImage {
  url: string
  width: number | null
  height: number | null
}

export async function blobImage (
  event: H3Event,
  blob: unknown,
  aspectRatio?: { width?: number, height?: number },
): Promise<BlobImage | null> {
  const cid = cidFromBlob(blob)
  if (!cid) return null

  const did = await resolveDid(event)
  const config = useRuntimeConfig(event)
  return {
    url: blobUrlFor(config.atproto.service, did, cid),
    width: aspectRatio?.width ?? null,
    height: aspectRatio?.height ?? null,
  }
}
