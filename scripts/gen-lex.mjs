#!/usr/bin/env node
/**
 * Regenerate TS types from the lexicon JSON files under `lexicons/`.
 *
 * The generated `shared/lex/index.ts` (full XRPC client surface) is removed
 * after generation because we drive the PDS via `AtpAgent` from
 * `@atproto/api` and only need the per-record types and the validator
 * registry. A hand-written barrel is restored from this script.
 */
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(here, '..')
const lexRoot = join(root, 'lexicons')
const outDir = join(root, 'shared/lex')

const lexiconFiles = []
function walk (dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile() && entry.name.endsWith('.json')) lexiconFiles.push(full)
  }
}
walk(lexRoot)

if (!lexiconFiles.length) {
  console.error('No lexicon JSON files found under', lexRoot)
  process.exit(1)
}

console.log(`Generating types for ${lexiconFiles.length} lexicons → ${outDir}`)

/**
 * `@atproto/lex-cli gen-api` prompts to overwrite each generated file. We
 * pipe a stream of `y\n` into its stdin instead of shelling out to
 * `yes y | …`, so lexicon paths containing spaces or shell metacharacters
 * can't break (or be abused to alter) the command line.
 */
await new Promise((resolvePromise, reject) => {
  const child = spawn(
    'pnpm',
    ['dlx', '@atproto/lex-cli', 'gen-api', outDir, ...lexiconFiles],
    { stdio: ['pipe', 'inherit', 'inherit'], cwd: root },
  )
  const writeY = () => {
    while (child.stdin.writable && child.stdin.write('y\n')) {
      // keep filling the buffer until the kernel says back off
    }
  }
  child.stdin.on('drain', writeY)
  child.stdin.on('error', () => {})
  writeY()
  child.on('error', reject)
  child.on('exit', code => {
    child.stdin.end()
    if (code === 0) resolvePromise()
    else reject(new Error(`lex-cli exited with code ${code}`))
  })
})

/**
 * Rewrite the generated relative-imports from `.js` to `.ts` so Node’s native
 * type-stripping (`node script.ts`) can resolve them at runtime without a
 * loader. TypeScript is configured with `allowImportingTsExtensions` to
 * accept the same shape at type-check time.
 */
function rewriteJsToTs (dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      rewriteJsToTs(full)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
    const src = readFileSync(full, 'utf8')
    const next = src.replace(/((?:from|import)\s+['"])((?:\.{1,2}\/)[^'"]+?)\.js(['"])/g, '$1$2.ts$3')
    if (next !== src) writeFileSync(full, next)
  }
}
rewriteJsToTs(outDir)

const generatedClient = join(outDir, 'index.ts')
rmSync(generatedClient, { force: true })

/**
 * Build the namespace-export lines by scanning the generated `types/`
 * tree, so adding a new lexicon JSON doesn't need a matching edit to this
 * script.
 */
function collectNamespaceExports (dir, prefix = '') {
  const lines = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      lines.push(...collectNamespaceExports(full, `${prefix}${capitalise(entry.name)}`))
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
    const base = entry.name.replace(/\.ts$/, '')
    const namespace = `${prefix}${capitalise(base)}`
    const relPath = `./types/${full.slice(typesRoot.length + 1).replace(/\\/g, '/')}`
    lines.push(`export * as ${namespace} from '${relPath}'`)
  }
  return lines
}
function capitalise (s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const typesRoot = join(outDir, 'types')
const namespaceLines = collectNamespaceExports(typesRoot).join('\n')

const barrel = `/**
 * Auto-generated barrel for the dev.roe lexicons. Re-run \`pnpm lex:gen\` to
 * refresh after adding or removing lexicon JSON files.
 *
 * The generated \`gen-api\` client surface was deleted because we drive the PDS
 * via the existing \`AtpAgent\` from \`@atproto/api\`; we only need the typed
 * record interfaces and the validator registry.
 */
export { schemas, lexicons, validate, schemaDict } from './lexicons.ts'
export type { $Typed, Un$Typed, OmitKey } from './util.ts'

${namespaceLines}
`
writeFileSync(generatedClient, barrel)

console.log('Done. Barrel written to', generatedClient)
