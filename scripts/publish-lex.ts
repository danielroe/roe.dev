/**
 * Publish the `dev.roe.*` lexicons in `lexicons/` to the PDS as
 * `com.atproto.lexicon.schema` records, so that they can be resolved by third
 * parties per https://atproto.com/specs/lexicon#lexicon-publication-and-resolution.
 *
 * Resolution also requires a DNS TXT record for each NSID authority. Every
 * schema here lives under the `dev.roe` authority.
 *
 *   _lexicon.roe.dev  TXT  "did=did:plc:jbeaa5kdaladzwq3r7f5xgwe"
 *
 * Usage:
 *   node --env-file=.env scripts/publish-lex.ts
 *   node --env-file=.env scripts/publish-lex.ts --dry-run
 *
 * Environment variables:
 *   NUXT_ATPROTO_HANDLE, NUXT_ATPROTO_PASSWORD, NUXT_PUBLIC_ATPROTO_SERVICE
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { AtpAgent } from '@atproto/api'
import { defineCommand, runMain } from 'citty'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const lexRoot = join(root, 'lexicons')

/** Authorities we control, and so are allowed to publish schemas for. */
const OWNED_AUTHORITIES = ['dev.roe']

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
  const authority = nsid.split('.').slice(0, -1).join('.')
  return OWNED_AUTHORITIES.includes(authority)
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
  },
  async run ({ args }) {
    const service = process.env.NUXT_PUBLIC_ATPROTO_SERVICE || 'https://bsky.social'
    const identifier = process.env.NUXT_ATPROTO_HANDLE
    const password = process.env.NUXT_ATPROTO_PASSWORD

    if (!identifier || !password) {
      console.error('Set NUXT_ATPROTO_HANDLE and NUXT_ATPROTO_PASSWORD (see .env.example).')
      process.exitCode = 1
      return
    }

    const lexicons = collectLexicons(lexRoot).filter(l => isOwned(l.nsid))
    if (!lexicons.length) {
      console.error('No owned lexicons found under', lexRoot)
      process.exitCode = 1
      return
    }

    const agent = new AtpAgent({ service })
    await agent.login({ identifier, password })
    const did = agent.session?.did
    if (!did) throw new Error('atproto login did not return a session')

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
    console.log('Resolution requires: _lexicon.roe.dev TXT "did=' + did + '"')
  },
})

runMain(main)
