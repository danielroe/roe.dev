import type { H3Event } from 'h3'
import { TID } from '@atproto/common-web'
import { jsonToLex } from '@atproto/lexicon'

import { requireAdminAgent } from './agent'
import { lexicons } from '#shared/lex'
import type { Collection, RecordTypes } from '../atproto'

export interface AdminRecord<C extends Collection> {
  rkey: string
  uri: string
  cid: string
  value: RecordTypes[C]
}

interface PutResult { rkey: string, uri: string, cid: string }

function rkeyFromUri (uri: string): string {
  return uri.split('/').pop() ?? ''
}

function assertRkey (rkey: string | undefined): asserts rkey is string {
  if (!rkey || rkey === 'undefined' || rkey === 'null') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid rkey.' })
  }
}

export async function listAdminRecords<C extends Collection> (
  event: H3Event,
  collection: C,
  options: { sortBy?: (r: AdminRecord<C>) => string | number } = {},
): Promise<AdminRecord<C>[]> {
  const { agent, did } = await requireAdminAgent(event)
  const records: AdminRecord<C>[] = []
  let cursor: string | undefined
  while (true) {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection,
      limit: 100,
      cursor,
    })
    for (const r of res.data.records) {
      records.push({
        rkey: rkeyFromUri(r.uri),
        uri: r.uri,
        cid: r.cid,
        value: r.value as RecordTypes[C],
      })
    }
    if (!res.data.cursor || res.data.records.length < 100) break
    cursor = res.data.cursor
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

export async function getAdminRecord<C extends Collection> (
  event: H3Event,
  collection: C,
  rkey: string | undefined,
): Promise<AdminRecord<C>> {
  assertRkey(rkey)
  const { agent, did } = await requireAdminAgent(event)
  try {
    const res = await agent.com.atproto.repo.getRecord({ repo: did, collection, rkey })
    return {
      rkey,
      uri: res.data.uri,
      cid: res.data.cid ?? '',
      value: res.data.value as RecordTypes[C],
    }
  }
  catch (err) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      throw createError({ statusCode: 404, statusMessage: `${collection}/${rkey} not found.` })
    }
    throw err
  }
}

async function putRecord<C extends Collection> (
  event: H3Event,
  collection: C,
  rkey: string,
  record: RecordTypes[C],
): Promise<PutResult> {
  const lexRecord = jsonToLex(record as unknown as Parameters<typeof jsonToLex>[0]) as RecordTypes[C]
  const validation = lexicons.validate(collection, lexRecord)
  if (!validation.success) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid ${collection}: ${validation.error.message}`,
    })
  }
  const { agent, did } = await requireAdminAgent(event)
  const res = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection,
    rkey,
    record: lexRecord as Record<string, unknown>,
  })
  return { rkey, uri: res.data.uri, cid: res.data.cid }
}

/** Create a record with a new TID rkey, or put one at a caller-supplied rkey (typically `self` for singletons). */
export function createAdminRecord<C extends Collection> (
  event: H3Event,
  collection: C,
  body: Omit<RecordTypes[C], '$type' | 'createdAt'>,
  rkey: string = TID.nextStr(),
): Promise<PutResult> {
  return putRecord(event, collection, rkey, {
    $type: collection,
    ...body,
    createdAt: new Date().toISOString(),
  } as RecordTypes[C])
}

/** Overwrite an existing record. */
export function updateAdminRecord<C extends Collection> (
  event: H3Event,
  collection: C,
  rkey: string | undefined,
  body: Omit<RecordTypes[C], '$type'>,
): Promise<PutResult> {
  assertRkey(rkey)
  return putRecord(event, collection, rkey, {
    $type: collection,
    ...body,
    createdAt: body.createdAt ?? new Date().toISOString(),
  } as RecordTypes[C])
}

export async function deleteAdminRecord (
  event: H3Event,
  collection: Collection,
  rkey: string | undefined,
): Promise<{ rkey: string, deleted: true }> {
  assertRkey(rkey)
  const { agent, did } = await requireAdminAgent(event)
  await agent.com.atproto.repo.deleteRecord({ repo: did, collection, rkey })
  return { rkey, deleted: true }
}
