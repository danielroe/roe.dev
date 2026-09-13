/**
 * Repair `dev.roe.ama` records whose `image` is not a valid blob.
 *
 * At least one record was written with the upload response spread into the
 * field instead of the blob itself, so `image` is a bare
 * `{ ref, size, mimeType }` with no `$type: 'blob'`, and carries the real blob
 * under a stray `original` key:
 *
 *   "image": { "ref": {...}, "size": 229104, "mimeType": "image/png",
 *              "original": { "$type": "blob", "ref": {...}, ... } }
 *
 * A record in that shape fails validation, so `list()` skips it and `get()`
 * throws — it is invisible to the site and to the editor. This rewrites
 * `image` to the nested `original`, or reconstructs the blob from the loose
 * fields when there is no `original`.
 *
 * Usage:
 *   node --env-file=.env scripts/repair-ama-images.ts            # dry run
 *   node --env-file=.env scripts/repair-ama-images.ts --write
 *   node --env-file=.env scripts/repair-ama-images.ts --write --rkey 3mo22lcghgk2q
 *
 * Environment:
 *   NUXT_ATPROTO_PASSWORD   app password (required for --write)
 *   NUXT_ATPROTO_HANDLE     defaults to danielroe.dev
 */
import process from 'node:process'

import { createAirspace, passwordSession } from 'airspace'
import type { Infer, Plain } from 'airspace'
import { defineCommand, runMain } from 'citty'

import { collections } from '../shared/collections.ts'

const HANDLE = process.env.NUXT_ATPROTO_HANDLE || 'danielroe.dev'

type AmaInput = Omit<Plain<Infer<typeof collections.ama.schema>>, '$type'>

interface LooseBlob {
  $type?: string
  ref?: unknown
  mimeType?: string
  size?: number
  original?: LooseBlob
}

const isValidBlob = (value: unknown): boolean => {
  const b = value as LooseBlob | null
  return !!b && typeof b === 'object' && b.$type === 'blob' && !!b.ref && typeof b.mimeType === 'string'
}

/** The blob hiding inside a malformed `image`, or null if there isn't one. */
function recover (image: unknown): LooseBlob | null {
  const b = image as LooseBlob | null
  if (!b || typeof b !== 'object') return null
  if (isValidBlob(b.original)) return b.original!
  // no `original`: rebuild from the loose fields, which are a blob minus `$type`
  if (b.ref && typeof b.mimeType === 'string' && typeof b.size === 'number') {
    return { $type: 'blob', ref: b.ref, mimeType: b.mimeType, size: b.size }
  }
  return null
}

const main = defineCommand({
  meta: {
    name: 'repair-ama-images',
    description: 'Rewrite dev.roe.ama records whose `image` is not a valid blob.',
  },
  args: {
    write: { type: 'boolean', description: 'Actually write. Omit for a dry run.', default: false },
    rkey: { type: 'string', description: 'Only consider this record key.' },
  },
  async run ({ args }) {
    const password = process.env.NUXT_ATPROTO_PASSWORD
    if (args.write && !password) {
      throw new Error('NUXT_ATPROTO_PASSWORD is required for --write.')
    }

    // Records in the broken shape fail validation, so they have to be read
    // through the raw listing rather than `airspace.ama.list()`.
    const identity = await resolveIdentity(HANDLE)
    const records = await listRaw(identity.service, identity.did)
    console.info(`${HANDLE} (${identity.did}) @ ${identity.service}`)
    console.info(`scanned ${records.length} dev.roe.ama records\n`)

    const broken = records.filter(({ rkey, value }) => {
      if (args.rkey && rkey !== args.rkey) return false
      return value.image !== undefined && !isValidBlob(value.image)
    })

    if (!broken.length) {
      console.info('nothing to repair.')
      return
    }

    const airspace = args.write
      ? createAirspace({
          identity,
          collections: { ama: collections.ama },
          session: await passwordSession({ service: identity.service, identifier: identity.did, password: password! }),
        })
      : null

    let repaired = 0
    for (const { rkey, value } of broken) {
      const blob = recover(value.image)
      if (!blob) {
        console.warn(`  ! ${rkey}  unrecoverable image, left alone: ${JSON.stringify(value.image).slice(0, 120)}`)
        continue
      }

      const { $type: _type, ...rest } = value
      const next = { ...rest, image: blob } as AmaInput

      if (!airspace) {
        console.info(`  ~ ${rkey}  image -> ${blob.mimeType} ${blob.size} bytes`)
        repaired++
        continue
      }

      const check = await airspace.ama.validate(next)
      if (!check.ok) {
        console.warn(`  ! ${rkey}  still invalid after repair, left alone:`, check.issues)
        continue
      }

      await airspace.ama.put(rkey, next)
      console.info(`  + ${rkey}  repaired`)
      repaired++
    }

    console.info(`\n${repaired}/${broken.length} ${args.write ? 'repaired' : 'repairable'}${args.write ? '' : ' (dry run, nothing written)'}`)
  },
})

/** Resolve handle -> DID -> PDS, the same way airspace does internally. */
async function resolveIdentity (handle: string): Promise<{ did: `did:${string}:${string}`, service: string }> {
  const res = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`)
  if (!res.ok) throw new Error(`could not resolve ${handle}: ${res.status}`)
  const { did } = await res.json() as { did: `did:${string}:${string}` }

  const docUrl = did.startsWith('did:plc:')
    ? `https://plc.directory/${did}`
    : `https://${did.slice('did:web:'.length)}/.well-known/did.json`
  const doc = await (await fetch(docUrl)).json() as { service?: { id: string, serviceEndpoint: string }[] }
  const service = doc.service?.find(s => s.id === '#atproto_pds' || s.id.endsWith('#atproto_pds'))?.serviceEndpoint
  if (!service) throw new Error(`${did} has no #atproto_pds service`)
  return { did, service }
}

/** Every `dev.roe.ama` record, unvalidated, so the broken ones are visible. */
async function listRaw (service: string, did: string): Promise<{ rkey: string, value: Record<string, any> }[]> {
  const out: { rkey: string, value: Record<string, any> }[] = []
  let cursor: string | undefined
  do {
    const url = new URL(`${service}/xrpc/com.atproto.repo.listRecords`)
    url.searchParams.set('repo', did)
    url.searchParams.set('collection', 'dev.roe.ama')
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`listRecords failed: ${res.status}`)
    const body = await res.json() as { records: { uri: string, value: Record<string, any> }[], cursor?: string }
    for (const r of body.records) out.push({ rkey: r.uri.slice(r.uri.lastIndexOf('/') + 1), value: r.value })
    cursor = body.cursor
  } while (cursor)
  return out
}

runMain(main)
