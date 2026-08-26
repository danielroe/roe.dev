import type { H3Event } from 'h3'
import { Client, XrpcResponseError } from '@atproto/lex'
import type { AtUriString, CidString, DidString, GetOptions, Infer, PutOptions, RecordSchema } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'

import { blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type { Loose } from '#shared/cms/strict'

/**
 * Reads against our own PDS don't need auth - `com.atproto.repo.listRecords`
 * and `getRecord` are open against any public repo. We use an unauthed
 * client for reads to dodge the PDS's per-account login rate limit, and only
 * log in on write paths.
 *
 * Both clients are cached per Nitro process.
 */
let readClient: Client | null = null
let authedClient: { client: Client, did: DidString } | null = null

function getReadClient (event: H3Event): Client {
  if (readClient) return readClient
  const config = useRuntimeConfig(event)
  readClient = new Client(config.public.atproto.service)
  return readClient
}

async function getAuthedClient (event: H3Event): Promise<{ client: Client, did: DidString }> {
  if (authedClient) return authedClient

  const config = useRuntimeConfig(event)
  const service = config.public.atproto.service
  const { handle, password } = config.atproto

  if (!service || !handle || !password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'atproto credentials are not configured (NUXT_ATPROTO_*).',
    })
  }

  const session = await PasswordSession.login({ service, identifier: handle, password })
  const client = new Client(session)

  authedClient = { client, did: client.assertDid }
  return authedClient
}

let didPromise: Promise<DidString> | null = null

/**
 * Resolve our PDS DID. The build-time `modules/atproto` module populates
 * `runtimeConfig.atproto.did` from the configured handle; if we've already
 * logged in we prefer the session DID. Cached for the lifetime of the process.
 */
export async function resolveDid (event: H3Event): Promise<DidString> {
  if (authedClient) return authedClient.did
  if (didPromise) return didPromise

  const config = useRuntimeConfig(event)

  if (!config.atproto.did) {
    throw createError({
      statusCode: 500,
      statusMessage: 'runtimeConfig.atproto.did is not set; the build-time atproto module did not resolve it.',
    })
  }

  didPromise = Promise.resolve(config.atproto.did as DidString)
  return didPromise
}

/** A record as returned by listRecords, with strongly typed `value`. */
export interface FetchedRecord<T extends RecordSchema> {
  uri: AtUriString
  cid: CidString
  value: Infer<T>
}

/**
 * Put (create or overwrite) a record at a known rkey. The client validates
 * against the lexicon before sending, so we fail fast on schema drift in dev.
 */
export async function putRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  rkey: string,
  value: Loose<Omit<Infer<T>, '$type'>>,
): Promise<{ uri: AtUriString, cid: CidString }> {
  const { client } = await getAuthedClient(event)
  const res = await client.put(schema, value as Omit<Infer<T>, '$type'>, { rkey } as unknown as PutOptions<T>)
  return { uri: res.uri, cid: res.cid }
}

/**
 * Get a single record by rkey. Returns null if it doesn't exist.
 *
 * `rkey` is typed conditionally on the concrete schema's key type, which TS
 * can't resolve while `T` is still generic; the casts on the option objects
 * here and in `putRecord` are safe because every `dev.roe.*` record takes a
 * plain string key.
 */
export async function getRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  rkey: string,
): Promise<FetchedRecord<T> | null> {
  const did = await resolveDid(event)
  const client = getReadClient(event)
  try {
    const res = await client.get(schema, { repo: did, rkey } as unknown as GetOptions<T>)
    return { uri: res.uri, cid: res.cid ?? '' as CidString, value: res.value }
  }
  catch (err: unknown) {
    if (err instanceof XrpcResponseError && err.status === 404) return null
    throw err
  }
}

/** List all records in a collection, paginating until exhausted. */
export async function listRecords<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  options: { limit?: number, reverse?: boolean } = {},
): Promise<FetchedRecord<T>[]> {
  const did = await resolveDid(event)
  const client = getReadClient(event)
  const records: FetchedRecord<T>[] = []

  for await (const r of client.listAll(schema, { repo: did, limit: 100, reverse: options.reverse })) {
    records.push({ uri: r.uri, cid: r.cid, value: r.value as Infer<T> })
    if (options.limit && records.length >= options.limit) break
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
    url: blobUrlFor(config.public.atproto.service, did, cid),
    width: aspectRatio?.width ?? null,
    height: aspectRatio?.height ?? null,
  }
}
