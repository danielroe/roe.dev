/**
 * Publish the `dev.roe.*` lexicons in `lexicons/` to the PDS as
 * `com.atproto.lexicon.schema` records, so that they can be resolved by third
 * parties per https://atproto.com/specs/lexicon#lexicon-publication-and-resolution.
 *
 * Identity is resolved the same way the site resolves it at build time, so the
 * only secret needed is the app password: the DID comes from the authority
 * domain's `_atproto` TXT record (or `--did`), and the PDS endpoint from the
 * `#atproto_pds` service entry of the DID document.
 *
 * Resolution by third parties also requires a DNS TXT record for each NSID
 * authority. Every schema here lives under `dev.roe`, so one record covers all
 * of them:
 *
 *   _lexicon.roe.dev  TXT  "did=<did>"
 *
 * Usage:
 *   node --env-file=.env scripts/publish-lex.ts
 *   node --env-file=.env scripts/publish-lex.ts --dry-run
 *
 * Environment variables:
 *   NUXT_ATPROTO_PASSWORD  app password (required)
 *   NUXT_ATPROTO_DID, NUXT_PUBLIC_ATPROTO_SERVICE  optional overrides
 */
import { readFileSync, readdirSync } from 'node:fs'
import { promises as dns } from 'node:dns'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { AtpAgent } from '@atproto/api'
import { defineCommand, runMain } from 'citty'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const lexRoot = join(root, 'lexicons')

/**
 * NSID authorities we control. Each one needs its own `_lexicon.<authority
 * reversed>` TXT record; the first is also where we look up the publishing
 * identity.
 */
const OWNED_AUTHORITIES = ['dev.roe']

/** `dev.roe` -> `roe.dev` */
function authorityDomain (authority: string): string {
  return authority.split('.').reverse().join('.')
}

interface LexiconFile {
  path: string
  nsid: string
  doc: Record<string, unknown>
}

function collectLexicons (dir: string): LexiconFile[] {
  const files: LexiconFile[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectLexicons(full))
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const doc = JSON.parse(readFileSync(full, 'utf8'))
    if (typeof doc.id !== 'string') throw new Error(`${full} has no string \`id\``)
    files.push({ path: full, nsid: doc.id, doc })
  }
  return files
}

function isOwned (nsid: string): boolean {
  return OWNED_AUTHORITIES.includes(nsid.split('.').slice(0, -1).join('.'))
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

/**
 * `com.atproto.lexicon.schema` records carry the same fields as the lexicon
 * file itself, minus anything the meta-schema doesn't define. `defs` keys must
 * not be `#`-prefixed, which our files already satisfy.
 */
function toSchemaRecord (doc: Record<string, unknown>) {
  return {
    $type: 'com.atproto.lexicon.schema',
    lexicon: doc.lexicon,
    id: doc.id,
    defs: doc.defs,
  }
}

function isEqual (a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

const main = defineCommand({
  meta: {
    name: 'publish-lex',
    description: 'Publish dev.roe lexicons to the PDS as com.atproto.lexicon.schema records',
  },
  args: {
    'dry-run': {
      type: 'boolean',
      description: 'Print what would change without writing to the PDS',
      default: false,
    },
    'did': {
      type: 'string',
      description: 'Publish to this DID instead of the one resolved from DNS',
    },
  },
  async run ({ args }) {
    const password = process.env.NUXT_ATPROTO_PASSWORD
    if (!password) {
      console.error('Set NUXT_ATPROTO_PASSWORD (see .env.example).')
      process.exitCode = 1
      return
    }

    const lexicons = collectLexicons(lexRoot).filter(l => isOwned(l.nsid))
    if (!lexicons.length) {
      console.error('No owned lexicons found under', lexRoot)
      process.exitCode = 1
      return
    }

    const domain = authorityDomain(OWNED_AUTHORITIES[0]!)
    const did = args.did || process.env.NUXT_ATPROTO_DID || await resolveDid(domain)
    const service = process.env.NUXT_PUBLIC_ATPROTO_SERVICE || await resolvePdsEndpoint(did)
    console.log(`${did} @ ${service}\n`)

    const agent = new AtpAgent({ service })
    await agent.login({ identifier: did, password })

    for (const { nsid, doc } of lexicons.sort((a, b) => a.nsid.localeCompare(b.nsid))) {
      const record = toSchemaRecord(doc)

      let existing: unknown
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo: did,
          collection: 'com.atproto.lexicon.schema',
          rkey: nsid,
        })
        existing = res.data.value
      }
      catch {
        existing = undefined
      }

      if (existing && isEqual(existing, record)) {
        console.log(`   unchanged  ${nsid}`)
        continue
      }

      const verb = existing ? 'update' : 'create'
      if (args['dry-run']) {
        console.log(`   ${verb} (dry run)  ${nsid}`)
        continue
      }

      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'com.atproto.lexicon.schema',
        rkey: nsid,
        record,
        validate: false,
      })
      console.log(`🟢 ${verb}d  ${nsid}`)
    }

    console.log(`\nat://${did}/com.atproto.lexicon.schema/<nsid>`)
    for (const authority of OWNED_AUTHORITIES) {
      console.log(`DNS: _lexicon.${authorityDomain(authority)} TXT "did=${did}"`)
    }
  },
})

runMain(main)
