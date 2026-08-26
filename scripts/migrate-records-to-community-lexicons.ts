/**
 * One-shot rewrite of existing records into the shapes that reference
 * `community.lexicon.*` defs:
 *
 *   dev.roe.usesItem  `links[].url` -> `links[].uri` (+ a role where the label
 *                     says what the link is), `image` blob + sibling
 *                     `aspectRatio` -> a single `community.lexicon.app.defs#image`
 *                     carrying its own dimensions and alt text.
 *   dev.roe.talk      `image` blob + sibling `aspectRatio` -> the same `#image`,
 *                     tagged `#purposeLogo`.
 *   dev.roe.location  flat `city`/`region`/`country`/`countryCode` ->
 *                     `community.lexicon.location.address`.
 *
 * Every rewrite preserves the rkey and `createdAt`, and is skipped when the
 * record is already in the new shape, so reruns are no-ops. Publish the updated
 * lexicons (`pnpm lex:publish`) before running this.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-records-to-community-lexicons.ts --dry-run
 *   node --env-file=.env scripts/migrate-records-to-community-lexicons.ts
 *   node --env-file=.env scripts/migrate-records-to-community-lexicons.ts --collection usesItem
 *
 * `--dry-run` reads over the unauthenticated client and validates the rewritten
 * records locally, so it needs no credentials. Writing needs
 * NUXT_ATPROTO_PASSWORD.
 */
import { promises as dns } from 'node:dns'
import process from 'node:process'

import { Client, asStringFormat, lexToJson } from '@atproto/lex'
import type { DidString, Infer, JsonValue, PutOptions, RecordSchema } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'
import { defineCommand, runMain } from 'citty'

import { community, dev } from '../shared/lex/index.ts'

const { defs } = community.lexicon.app

type LegacyAspectRatio = { width?: number, height?: number } | undefined
type LegacyBlob = NonNullable<dev.roe.talk.Main['image']>['image']

/**
 * `community.lexicon.app.defs#image` caps blobs at 2 MB, where the fields it
 * replaces allowed 5 MB. A handful of records hold oversized PNGs; they can't be
 * rewritten until the image is replaced with a smaller one, which has to happen
 * in the editor because re-encoding here would silently change the artwork.
 */
const IMAGE_MAX_BYTES = 2_000_000

function oversizedBlob (blob: unknown): number | null {
  const size = (blob as { size?: unknown } | null)?.size
  return typeof size === 'number' && size > IMAGE_MAX_BYTES ? size : null
}

class NeedsSmallerImage extends Error {
  constructor (size: number) {
    super(`image is ${(size / 1_000_000).toFixed(1)} MB; replace it with one under 2 MB in the editor first`)
  }
}

interface Rewrite<T extends RecordSchema> {
  schema: T
  /** Returns the new record value, or null when it is already migrated. */
  rewrite: (value: Infer<T>) => Omit<Infer<T>, '$type'> | null
}

/**
 * Roles worth inferring from the labels already on `dev.roe.usesItem` links.
 * Labels are left alone: they are what the page renders.
 */
const ROLE_BY_LABEL: Record<string, string> = {
  website: defs.linkRoleWebsite.value,
  source: defs.linkRoleSourceCode.value,
  docs: defs.linkRoleDocs.value,
  marketplace: defs.linkRoleAppStore.value,
}

function communityImage (blob: LegacyBlob, alt: string, aspectRatio: LegacyAspectRatio, purpose?: string) {
  const size = oversizedBlob(blob)
  if (size) throw new NeedsSmallerImage(size)

  const ratio = aspectRatio?.width && aspectRatio?.height
    ? { width: aspectRatio.width, height: aspectRatio.height }
    : undefined
  return {
    $type: 'community.lexicon.app.defs#image' as const,
    ...(purpose ? { purpose } : {}),
    image: blob,
    alt,
    ...(ratio ? { aspectRatio: ratio } : {}),
  }
}

const usesItem: Rewrite<typeof dev.roe.usesItem.main> = {
  schema: dev.roe.usesItem.main,
  rewrite (value) {
    const legacy = value as Omit<typeof value, 'links'> & {
      aspectRatio?: LegacyAspectRatio
      links?: Array<{ url?: string, uri?: string, label?: string, role?: string }>
    }

    const linksNeedWork = !!legacy.links?.some(l => l.url !== undefined)
    const imageNeedsWork = !!value.image && !('alt' in value.image)
    if (!linksNeedWork && !imageNeedsWork && legacy.aspectRatio === undefined) return null

    const { $type, aspectRatio, ...rest } = legacy

    return {
      ...rest,
      ...(legacy.links?.length
        ? {
            links: legacy.links.map(link => {
              const uri = link.uri ?? link.url ?? ''
              const role = link.role ?? ROLE_BY_LABEL[link.label?.trim().toLowerCase() ?? '']
              return {
                $type: 'community.lexicon.app.defs#link' as const,
                uri: asStringFormat(uri, 'uri'),
                ...(link.label ? { label: link.label } : {}),
                ...(role ? { role } : {}),
              }
            }),
          }
        : {}),
      ...(value.image
        ? {
            image: 'alt' in value.image
              ? value.image
              : communityImage(value.image as LegacyBlob, value.name, aspectRatio),
          }
        : {}),
    } as Omit<Infer<typeof dev.roe.usesItem.main>, '$type'>
  },
}

const talk: Rewrite<typeof dev.roe.talk.main> = {
  schema: dev.roe.talk.main,
  rewrite (value) {
    const legacy = value as typeof value & { aspectRatio?: LegacyAspectRatio }
    const imageNeedsWork = !!value.image && !('alt' in value.image)
    if (!imageNeedsWork && legacy.aspectRatio === undefined) return null

    const { $type, aspectRatio, ...rest } = legacy

    return {
      ...rest,
      ...(value.image
        ? {
            image: 'alt' in value.image
              ? value.image
              : communityImage(value.image as LegacyBlob, `Logo for ${value.source}`, aspectRatio, defs.purposeLogo.value),
          }
        : {}),
    } as Omit<Infer<typeof dev.roe.talk.main>, '$type'>
  },
}

const location: Rewrite<typeof dev.roe.location.main> = {
  schema: dev.roe.location.main,
  rewrite (value) {
    if (value.address) return null

    const legacy = value as typeof value & {
      city?: string
      region?: string
      country?: string
      countryCode?: string
    }

    if (!legacy.countryCode) throw new Error('location record has neither `address` nor `countryCode`')

    return {
      address: {
        $type: 'community.lexicon.location.address' as const,
        country: legacy.countryCode.toUpperCase(),
        ...(legacy.region ? { region: legacy.region } : {}),
        ...(legacy.city ? { locality: legacy.city } : {}),
      },
      ...(legacy.meetupAvailable === undefined ? {} : { meetupAvailable: legacy.meetupAvailable }),
      createdAt: value.createdAt,
    }
  },
}

const REWRITES = { usesItem, talk, location } as const
type CollectionName = keyof typeof REWRITES

async function resolveDid (domain: string): Promise<string> {
  const records = await dns.resolveTxt(`_atproto.${domain}`).catch(() => [])
  for (const chunks of records) {
    const value = chunks.join('')
    if (value.startsWith('did=')) return value.slice('did='.length)
  }

  const res = await fetch(`https://${domain}/.well-known/atproto-did`)
  if (!res.ok) throw new Error(`could not resolve a DID for ${domain}`)
  return (await res.text()).trim()
}

async function resolvePdsEndpoint (did: string): Promise<string> {
  const url = did.startsWith('did:plc:')
    ? `https://plc.directory/${did}`
    : did.startsWith('did:web:')
      ? `https://${did.slice('did:web:'.length)}/.well-known/did.json`
      : null
  if (!url) throw new Error(`unsupported DID method: ${did}`)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  const doc = await res.json() as { service?: Array<{ id: string, serviceEndpoint: string }> }
  const pds = doc.service?.find(s => s.id === '#atproto_pds' || s.id.endsWith('#atproto_pds'))
  if (!pds?.serviceEndpoint) throw new Error(`DID doc for ${did} has no #atproto_pds service entry`)
  return pds.serviceEndpoint
}

interface RewriteContext {
  reader: Client
  writer?: Client
  did: DidString
  print: boolean
}

/** Rewrites one collection, returning the number of records that failed. */
async function rewriteCollection<T extends RecordSchema> (
  name: string,
  { schema, rewrite }: Rewrite<T>,
  { reader, writer, did, print }: RewriteContext,
): Promise<number> {
  let migrated = 0
  let unchanged = 0
  let failed = 0
  const blocked: string[] = []

  for await (const record of reader.listAll(schema, { repo: did, limit: 100 })) {
    const rkey = record.uri.split('/').pop()!

    let next: Omit<Infer<T>, '$type'> | null
    try {
      next = rewrite(record.value as Infer<T>)
    }
    catch (err) {
      if (err instanceof NeedsSmallerImage) {
        blocked.push(`${name}/${rkey}: ${err.message}`)
        continue
      }
      failed++
      console.log(`🔴 ${name}/${rkey}: ${err instanceof Error ? err.message : String(err)}`)
      continue
    }

    if (!next) {
      unchanged++
      continue
    }

    const check = schema.safeValidate({ $type: schema.$type, ...next } as never)
    if (!check.success) {
      failed++
      console.log(`🔴 ${name}/${rkey}: ${check.message}`)
      continue
    }

    if (print && migrated === 0) {
      console.log(JSON.stringify(lexToJson(next as JsonValue), null, 2))
    }

    if (writer) {
      await writer.put(schema, next, { repo: did, rkey, validateRequest: true } as unknown as PutOptions<T>)
    }
    migrated++
    console.log(`${writer ? '🟢 rewrote' : '   would rewrite'}  ${name}/${rkey}`)
  }

  for (const message of blocked) console.log(`⚠️  ${message}`)
  console.log(`\n${name}: ${migrated} to rewrite, ${unchanged} unchanged, ${blocked.length} waiting on a smaller image, ${failed} failed\n`)

  return failed
}

const main = defineCommand({
  meta: {
    name: 'migrate-records-to-community-lexicons',
    description: 'Rewrite existing dev.roe records into the community.lexicon shapes',
  },
  args: {
    'dry-run': {
      type: 'boolean',
      description: 'Validate the rewrites without writing to the PDS',
      default: false,
    },
    'print': {
      type: 'boolean',
      description: 'Print the first rewritten record of each collection',
      default: false,
    },
    'collection': {
      type: 'string',
      description: `One of ${Object.keys(REWRITES).join(', ')}; defaults to all`,
    },
  },
  async run ({ args }) {
    const collections = args.collection
      ? [args.collection as CollectionName]
      : (Object.keys(REWRITES) as CollectionName[])

    for (const name of collections) {
      if (!(name in REWRITES)) throw new Error(`unknown collection: ${name}`)
    }

    const did = asStringFormat(process.env.NUXT_ATPROTO_DID || await resolveDid('roe.dev'), 'did')
    const service = process.env.NUXT_PUBLIC_ATPROTO_SERVICE || await resolvePdsEndpoint(did)
    console.log(`${did} @ ${service}${args['dry-run'] ? ' (dry run)' : ''}\n`)

    const reader = new Client(service)

    let writer: Client | undefined
    if (!args['dry-run']) {
      const password = process.env.NUXT_ATPROTO_PASSWORD
      if (!password) {
        console.error('Set NUXT_ATPROTO_PASSWORD (see .env.example), or pass --dry-run.')
        process.exitCode = 1
        return
      }
      writer = new Client(await PasswordSession.login({ service, identifier: did, password }))
    }

    for (const name of collections) {
      const context = { reader, writer, did, print: args.print }
      const failed = name === 'usesItem'
        ? await rewriteCollection(name, usesItem, context)
        : name === 'talk'
          ? await rewriteCollection(name, talk, context)
          : await rewriteCollection(name, location, context)
      if (failed) process.exitCode = 1
    }
  },
})

runMain(main)
