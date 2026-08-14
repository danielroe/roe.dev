import type { H3Event } from 'h3'
import { LexValidationError, XrpcResponseError, jsonToLex, lexToJson } from '@atproto/lex'
import type { AtUriString, CidString, CreateOptions, DeleteOptions, GetOptions, Infer, JsonValue, PutOptions, RecordSchema } from '@atproto/lex'

import { requireAdminClient } from './client'
import type { Loose } from '#shared/cms/strict'

export interface AdminRecord<T extends RecordSchema> {
  rkey: string
  uri: string
  cid: string
  value: Infer<T>
}

interface PutResult { rkey: string, uri: AtUriString, cid: CidString }

function rkeyFromUri (uri: string): string {
  return uri.split('/').pop() ?? ''
}

/**
 * Record values hold lex representations (a blob ref's `ref` is a `Cid`
 * instance), which `JSON.stringify` would emit as DAG-JSON (`{ '/': cid }`).
 * The admin UI posts values straight back to us, and `writeRecord` decodes
 * them with `jsonToLex`, which only accepts the `{ $link: cid }` form.
 */
function toJsonValue<T extends RecordSchema> (value: Infer<T>): Infer<T> {
  return lexToJson(value) as Infer<T>
}

function assertRkey (rkey: string | undefined): asserts rkey is string {
  if (!rkey || rkey === 'undefined' || rkey === 'null') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid rkey.' })
  }
}

export async function listAdminRecords<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  options: { sortBy?: (r: AdminRecord<T>) => string | number } = {},
): Promise<AdminRecord<T>[]> {
  const { client, did } = await requireAdminClient(event)
  const records: AdminRecord<T>[] = []
  for await (const r of client.listAll(schema, { repo: did, limit: 100 })) {
    records.push({
      rkey: rkeyFromUri(r.uri),
      uri: r.uri,
      cid: r.cid,
      value: toJsonValue<T>(r.value as Infer<T>),
    })
  }
  if (options.sortBy) {
    const { sortBy } = options
    records.sort((a, b) => {
      const va = sortBy(a)
      const vb = sortBy(b)
      return typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
    })
  }
  return records
}

/**
 * `rkey` is typed conditionally on the concrete schema's key type, which TS
 * can't resolve while `T` is still generic; the casts on the option objects
 * throughout this file are safe because every `dev.roe.*` record takes a plain
 * string key.
 */
export async function getAdminRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  rkey: string | undefined,
): Promise<AdminRecord<T>> {
  assertRkey(rkey)
  const { client, did } = await requireAdminClient(event)
  try {
    const res = await client.get(schema, { repo: did, rkey } as unknown as GetOptions<T>)
    return { rkey, uri: res.uri, cid: res.cid ?? '', value: toJsonValue<T>(res.value) }
  }
  catch (err) {
    if (err instanceof XrpcResponseError && err.status === 404) {
      throw createError({ statusCode: 404, statusMessage: `${schema.$type}/${rkey} not found.` })
    }
    throw err
  }
}

/**
 * Blob refs arrive from the admin UI in their JSON encoding
 * (`{ $type: 'blob', ref: { $link } }`); `jsonToLex` turns those back into
 * the lex representation the record schema expects.
 */
async function writeRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  rkey: string | undefined,
  value: Loose<Omit<Infer<T>, '$type'>>,
): Promise<PutResult> {
  const { client, did } = await requireAdminClient(event)
  const input = jsonToLex(value as JsonValue) as Omit<Infer<T>, '$type'>

  try {
    const res = rkey === undefined
      ? await client.create(schema, input, { repo: did, validateRequest: true } as unknown as CreateOptions<T>)
      : await client.put(schema, input, { repo: did, rkey, validateRequest: true } as unknown as PutOptions<T>)
    return { rkey: rkey ?? rkeyFromUri(res.uri), uri: res.uri, cid: res.cid }
  }
  catch (err) {
    if (err instanceof LexValidationError) {
      throw createError({ statusCode: 422, statusMessage: `Invalid ${schema.$type}: ${err.message}` })
    }
    throw err
  }
}

/** Create a record with a server-generated TID rkey, or put one at a caller-supplied rkey (typically `self` for singletons). */
export function createAdminRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  body: Loose<Omit<Infer<T>, '$type' | 'createdAt'>>,
  rkey?: string,
): Promise<PutResult> {
  return writeRecord(event, schema, rkey, {
    ...(body as Record<string, unknown>),
    createdAt: new Date().toISOString(),
  } as unknown as Loose<Omit<Infer<T>, '$type'>>)
}

/** Overwrite an existing record. */
export function updateAdminRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  rkey: string | undefined,
  body: Loose<Omit<Infer<T>, '$type' | 'createdAt'>> & { createdAt?: string },
): Promise<PutResult> {
  assertRkey(rkey)
  return writeRecord(event, schema, rkey, {
    ...(body as Record<string, unknown>),
    createdAt: body.createdAt ?? new Date().toISOString(),
  } as unknown as Loose<Omit<Infer<T>, '$type'>>)
}

export async function deleteAdminRecord<T extends RecordSchema> (
  event: H3Event,
  schema: T,
  rkey: string | undefined,
): Promise<{ rkey: string, deleted: true }> {
  assertRkey(rkey)
  const { client, did } = await requireAdminClient(event)
  await client.delete(schema, { repo: did, rkey } as unknown as DeleteOptions<T>)
  return { rkey, deleted: true }
}
