import type { H3Event } from 'h3'
import { ConflictError, ValidationError } from 'airspace'

import { invalidatePublicReads, requireAdminAirspace } from '../airspace'
import { collections } from '#shared/collections'

type Airspace = Awaited<ReturnType<typeof requireAdminAirspace>>

/** The collections the generic CRUD routes serve. `location` is a singleton and has its own routes. */
export type CollectionName = Exclude<keyof typeof collections, 'location'>

const nsidOf = (name: CollectionName): string => collections[name].nsid

async function clientFor<K extends CollectionName> (event: H3Event, name: K): Promise<Airspace[K]> {
  return (await requireAdminAirspace(event))[name]
}

/**
 * Each helper below is generic over the collection, so `airspace[name]` is a
 * union of clients whose methods TypeScript cannot call in common. The public
 * signatures stay precise; only the dispatch inside is untyped.
 */
type AnyClient = {
  list: () => Promise<any[]>
  get: (rkey: string) => Promise<any>
  create: (value: any) => Promise<any>
  put: (rkey: string, value: any) => Promise<any>
  delete: (rkey: string) => Promise<void>
}

const untyped = (client: unknown): AnyClient => client as AnyClient

function assertRkey (rkey: string | undefined): asserts rkey is string {
  if (!rkey || rkey === 'undefined' || rkey === 'null') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid rkey.' })
  }
}

/**
 * airspace's errors already name the collection and record key; this only
 * picks the status code the admin UI expects.
 */
function asHttpError (err: unknown, name: CollectionName): never {
  if (err instanceof ValidationError) {
    throw createError({ statusCode: 422, statusMessage: `Invalid ${nsidOf(name)}: ${err.message}` })
  }
  if (err instanceof ConflictError) {
    throw createError({ statusCode: 409, statusMessage: err.message })
  }
  throw err
}

/** Run a write and drop the public client's cache for the collection it touched. */
async function write<T> (name: CollectionName, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  }
  catch (err) {
    asHttpError(err, name)
  }
  finally {
    invalidatePublicReads(nsidOf(name))
  }
}

export async function listAdminRecords<K extends CollectionName> (event: H3Event, name: K): Promise<Awaited<ReturnType<Airspace[K]['list']>>> {
  return await untyped(await clientFor(event, name)).list() as never
}

export async function getAdminRecord<K extends CollectionName> (event: H3Event, name: K, rkey: string | undefined): Promise<NonNullable<Awaited<ReturnType<Airspace[K]['get']>>>> {
  assertRkey(rkey)
  const record = await untyped(await clientFor(event, name)).get(rkey)
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: `${nsidOf(name)}/${rkey} not found.` })
  }
  return record as never
}

export async function createAdminRecord<K extends CollectionName> (
  event: H3Event,
  name: K,
  value: Parameters<Airspace[K]['create']>[0],
): Promise<Awaited<ReturnType<Airspace[K]['create']>>> {
  const client = untyped(await clientFor(event, name))
  return await write(name, () => client.create(value))
}

export async function updateAdminRecord<K extends CollectionName> (
  event: H3Event,
  name: K,
  rkey: string | undefined,
  value: Parameters<Airspace[K]['put']>[1],
): Promise<Awaited<ReturnType<Airspace[K]['put']>>> {
  assertRkey(rkey)
  const client = untyped(await clientFor(event, name))
  return await write(name, () => client.put(rkey, value))
}

export async function deleteAdminRecord<K extends CollectionName> (event: H3Event, name: K, rkey: string | undefined) {
  assertRkey(rkey)
  const client = untyped(await clientFor(event, name))
  await write(name, () => client.delete(rkey))
  return { rkey, deleted: true as const }
}
