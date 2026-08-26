/**
 * One-shot `content/projects.yml` → atproto migration script. Creates a
 * `dev.roe.projectCategory` record per category and a `dev.roe.project` record
 * per item, uploading each item's `image` (a path under `public/`) as a blob.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-projects-to-atproto.ts --dry-run
 *   node --env-file=.env scripts/migrate-projects-to-atproto.ts
 *   node --env-file=.env scripts/migrate-projects-to-atproto.ts --reset
 *
 * Flags:
 *   --dry-run  Don't write anything; print what would happen.
 *   --reset    Delete every record this script created (per the manifest),
 *              clear the manifest, then exit.
 *
 * Idempotency: a manifest at scripts/.projects-migration-state.json maps
 * `category:<title>` / `project:<category>/<name>` keys to the at:// URI that
 * was created for them, so reruns skip anything already migrated. Categories
 * are written before projects, because `project.category` is a strong-ref.
 *
 * Identity resolution matches scripts/publish-lex.ts: only
 * NUXT_ATPROTO_PASSWORD is required.
 *
 * Both this script and `content/projects.yml` can be deleted once the
 * migration has run against the live PDS.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { promises as dns } from 'node:dns'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { Client, asStringFormat } from '@atproto/lex'
import type { l } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'
import { defineCommand, runMain } from 'citty'
import { imageMeta } from 'image-meta'
import { load as loadYaml } from 'js-yaml'

import { community, dev } from '../shared/lex/index.ts'

const { defs } = community.lexicon.app

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const manifestPath = join(here, '.projects-migration-state.json')

interface YamlProject {
  name: string
  description?: string
  url?: string
  repo?: string
  image?: string
  icon?: string
  archived?: boolean
  order?: number
}

interface YamlCategory {
  category: string
  order?: number
  items?: YamlProject[]
}

interface ManifestEntry {
  uri: string
  cid: string
}

type Manifest = Record<string, ManifestEntry>

function loadManifest (): Manifest {
  if (!existsSync(manifestPath)) return {}
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest
  }
  catch {
    return {}
  }
}

function saveManifest (manifest: Manifest): void {
  const sorted: Manifest = {}
  for (const key of Object.keys(manifest).sort()) sorted[key] = manifest[key]!
  writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n')
}

async function resolveDid (domain: string): Promise<string> {
  const records = await dns.resolveTxt(`_atproto.${domain}`).catch(() => [])
  for (const chunks of records) {
    const value = chunks.join('')
    if (value.startsWith('did=')) return value.slice('did='.length)
  }

  const res = await fetch(`https://${domain}/.well-known/atproto-did`)
  if (!res.ok) throw new Error(`could not resolve a DID for ${domain} via _atproto TXT or /.well-known/atproto-did`)
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

const MIME_BY_EXT: Record<string, `${string}/${string}`> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

function readCategories (): YamlCategory[] {
  const parsed = loadYaml(readFileSync(join(root, 'content/projects.yml'), 'utf8'))
  if (!Array.isArray(parsed)) throw new Error('content/projects.yml did not parse to an array')
  return parsed as YamlCategory[]
}

const main = defineCommand({
  meta: {
    name: 'migrate-projects-to-atproto',
    description: 'Migrate content/projects.yml into dev.roe.projectCategory + dev.roe.project records',
  },
  args: {
    'dry-run': {
      type: 'boolean',
      description: 'Print what would change without writing to the PDS',
      default: false,
    },
    'reset': {
      type: 'boolean',
      description: 'Delete every record in the manifest and clear it',
      default: false,
    },
  },
  async run ({ args }) {
    const password = process.env.NUXT_ATPROTO_PASSWORD
    if (!password) {
      console.error('Set NUXT_ATPROTO_PASSWORD (see .env.example).')
      process.exitCode = 1
      return
    }

    const did = asStringFormat(process.env.NUXT_ATPROTO_DID || await resolveDid('roe.dev'), 'did')
    const service = process.env.NUXT_PUBLIC_ATPROTO_SERVICE || await resolvePdsEndpoint(did)
    console.log(`${did} @ ${service}\n`)

    const session = await PasswordSession.login({ service, identifier: did, password })
    const client = new Client(session)
    const manifest = loadManifest()

    if (args.reset) {
      const remaining: Manifest = { ...manifest }
      for (const [key, entry] of Object.entries(manifest)) {
        const [collection, rkey] = [entry.uri.split('/').at(-2)!, entry.uri.split('/').at(-1)!]
        if (args['dry-run']) {
          console.log(`   delete (dry run)  ${entry.uri}`)
          continue
        }
        await client.deleteRecord(collection as `${string}.${string}.${string}`, rkey, { repo: did })
        Reflect.deleteProperty(remaining, key)
        console.log(`🗑  deleted  ${entry.uri}`)
      }
      if (!args['dry-run']) saveManifest(remaining)
      return
    }

    const createdAt = asStringFormat(new Date().toISOString(), 'datetime')

    for (const category of readCategories()) {
      const categoryKey = `category:${category.category}`
      let categoryEntry = manifest[categoryKey]

      if (categoryEntry) {
        console.log(`   unchanged  ${category.category}`)
      }
      else if (args['dry-run']) {
        console.log(`   create (dry run)  category ${category.category}`)
        categoryEntry = { uri: `at://${did}/dev.roe.projectCategory/dry-run`, cid: 'dry-run' }
      }
      else {
        const res = await client.create(dev.roe.projectCategory.main, {
          title: category.category,
          order: category.order ?? 100,
          createdAt,
        }, { repo: did, validateRequest: true })
        categoryEntry = { uri: res.uri, cid: res.cid }
        manifest[categoryKey] = categoryEntry
        saveManifest(manifest)
        console.log(`🟢 created  category ${category.category}`)
      }

      for (const item of category.items ?? []) {
        const itemKey = `project:${category.category}/${item.name}`
        if (manifest[itemKey]) {
          console.log(`   unchanged  ${item.name}`)
          continue
        }

        let image: l.BlobRef | undefined
        let aspectRatio: { width: number, height: number } | undefined
        if (item.image) {
          const path = join(root, 'public', item.image.replace(/^\//, ''))
          if (!existsSync(path)) throw new Error(`${item.name}: ${item.image} does not exist under public/`)
          const bytes = new Uint8Array(readFileSync(path))
          const ext = item.image.slice(item.image.lastIndexOf('.')).toLowerCase()
          const encoding = MIME_BY_EXT[ext]
          if (!encoding) throw new Error(`${item.name}: unsupported image extension ${ext}`)

          const { width, height } = imageMeta(bytes)
          if (width && height) aspectRatio = { width, height }

          if (args['dry-run']) {
            console.log(`   upload (dry run)  ${item.image} (${bytes.byteLength} bytes)`)
          }
          else {
            const uploaded = await client.uploadBlob(bytes, { encoding })
            image = uploaded.body.blob
          }
        }

        if (args['dry-run']) {
          console.log(`   create (dry run)  project ${item.name}`)
          continue
        }

        const links = [
          ...(item.url ? [{ uri: asStringFormat(item.url, 'uri'), role: defs.linkRoleWebsite.value }] : []),
          ...(item.repo && item.repo !== item.url
            ? [{ uri: asStringFormat(item.repo, 'uri'), role: defs.linkRoleSourceCode.value }]
            : []),
        ]

        const res = await client.create(dev.roe.project.main, {
          category: { uri: asStringFormat(categoryEntry.uri, 'at-uri'), cid: categoryEntry.cid },
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(links.length ? { links } : {}),
          ...(image
            ? {
                images: [{
                  purpose: defs.purposeScreenshot.value,
                  image,
                  alt: `Screenshot of ${item.name}`,
                  ...(aspectRatio ? { aspectRatio } : {}),
                }],
              }
            : {}),
          ...(item.archived ? { status: defs.unmaintained.value } : {}),
          ...(item.icon ? { icon: item.icon } : {}),
          order: item.order ?? 100,
          createdAt,
        }, { repo: did, validateRequest: true })

        manifest[itemKey] = { uri: res.uri, cid: res.cid }
        saveManifest(manifest)
        console.log(`🟢 created  project ${item.name}${image ? ' (+ image)' : ''}`)
      }
    }
  },
})

runMain(main)
