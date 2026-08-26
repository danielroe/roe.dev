/** @vitest-environment node */

import { execSync } from 'node:child_process'
import fsp from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { glob as globby } from 'tinyglobby'
import { join } from 'pathe'

/**
 * Prebuilt native binaries are resolved for whichever platform the build runs
 * on, so their names and sizes can't be snapshotted.
 */
const NATIVE_BINARY_RE = /(?:linux|darwin|win32)-(?:arm64|x64)/
const NATIVE_BINARY_GLOB = '!node_modules/**/*{linux,darwin,win32}-{arm64,x64}*/**'

describe('project sizes', () => {
  const rootDir = fileURLToPath(new URL('../..', import.meta.url))
  const publicDir = join(rootDir, '.output/public')
  const serverDir = join(rootDir, '.output/server')
  const manifestPath = join(
    rootDir,
    'node_modules/.cache/bundle-test-client-manifest.json',
  )

  const stats = {
    client: { totalBytes: 0, files: [] as string[] },
    server: { totalBytes: 0, files: [] as string[] },
  }

  beforeAll(async () => {
    execSync('pnpm nuxt build', {
      cwd: rootDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DISABLE_PRERENDER: 'true',
        TEST: 'true',
        VITEST: 'true',
        NUXT_CLIENT_MANIFEST_PATH: manifestPath,
      },
    })
  }, 120 * 1000)

  afterAll(async () => {
    await fsp.writeFile(
      join(rootDir, '.output/test-stats.json'),
      JSON.stringify(stats, null, 2),
    )
  })

  it('public (non-admin) client bundle size', async () => {
    const adminOnly = await loadAdminOnlyChunks(manifestPath)

    const allFiles: string[] = await globby(
      ['**/*.js', '!_scripts/**', '!**/_payload.js', '!_nuxt/builds/**'],
      { cwd: publicDir },
    )
    const publicFiles = allFiles.filter(f => !adminOnly.has(basenameOf(f)))
    stats.client = await measureFiles(publicFiles, publicDir)

    expect
      .soft(roundToKilobytes(stats.client.totalBytes))
      .toMatchInlineSnapshot(`"270k"`)
    expect.soft(stats.client.files.map(f => f.replace(/\..*\.js/, '.js')).sort())
      .toMatchInlineSnapshot(`
        [
          "_nuxt/BlueskyComments.js",
          "_nuxt/entry.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!node_modules'], serverDir)
    expect
      .soft(roundToKilobytes(stats.server.totalBytes, 10))
      .toMatchInlineSnapshot(`"1930k"`)

    const modules = await analyzeSizes('node_modules/**/*', serverDir)
    const portableModules = await analyzeSizes(
      ['node_modules/**/*', NATIVE_BINARY_GLOB],
      serverDir,
    )
    expect
      .soft(roundToKilobytes(portableModules.totalBytes, 10))
      .toMatchInlineSnapshot(`"13820k"`)

    const packages = modules.files
      .filter(m => m.endsWith('package.json') && !NATIVE_BINARY_RE.test(m))
      .map(m => m.replace('/package.json', '').replace('node_modules/', ''))
      .sort()
    expect.soft(packages).toMatchInlineSnapshot(`
      [
        "@atcute/bluesky-richtext-segmenter",
        "@atproto-labs/did-resolver",
        "@atproto-labs/fetch",
        "@atproto-labs/fetch-node",
        "@atproto-labs/fetch-node/node_modules/undici",
        "@atproto-labs/handle-resolver",
        "@atproto-labs/handle-resolver-node",
        "@atproto-labs/identity-resolver",
        "@atproto-labs/pipe",
        "@atproto-labs/simple-store",
        "@atproto-labs/simple-store-memory",
        "@atproto-labs/simple-store-memory/node_modules/lru-cache",
        "@atproto-labs/simple-store-memory/node_modules/lru-cache/dist/esm",
        "@atproto/did",
        "@atproto/jwk",
        "@atproto/jwk-jose",
        "@atproto/jwk-webcrypto",
        "@atproto/lex",
        "@atproto/lex-client",
        "@atproto/lex-data",
        "@atproto/lex-json",
        "@atproto/lex-password-session",
        "@atproto/lex-schema",
        "@atproto/oauth-client",
        "@atproto/oauth-client-node",
        "@atproto/oauth-types",
        "@atproto/syntax",
        "@babel/parser",
        "@bsky/sdk",
        "@formkit/drag-and-drop",
        "@img/colour",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
        "@vue/compiler-core",
        "@vue/compiler-core/node_modules/entities",
        "@vue/compiler-core/node_modules/entities/dist/commonjs",
        "@vue/compiler-dom",
        "@vue/compiler-ssr",
        "@vue/reactivity",
        "@vue/runtime-core",
        "@vue/runtime-dom",
        "@vue/server-renderer",
        "@vue/shared",
        "comark",
        "comark/node_modules/entities",
        "consola",
        "core-js",
        "detect-libc",
        "devalue",
        "entities",
        "estree-walker",
        "events-to-async",
        "events-to-async/module",
        "feed",
        "fnv1a-64",
        "hookable",
        "image-meta",
        "ipaddr.js",
        "ipx",
        "iso-datestring-validator",
        "jose",
        "jose/dist/node/esm",
        "js-yaml",
        "lru-cache",
        "lru-cache/dist/esm",
        "mediabunny",
        "modern-screenshot",
        "multiformats",
        "nostics",
        "object-identity",
        "partysocket",
        "sax",
        "semver",
        "sharp",
        "source-map-js",
        "srvx",
        "ts-custom-error",
        "ufo",
        "ultrahtml",
        "undici",
        "undici_v6",
        "undici_v7",
        "undici_v8",
        "unhead",
        "unicode-segmenter",
        "vue",
        "vue-bundle-renderer",
        "xml-js",
        "zod",
      ]
    `)
  })
})

async function analyzeSizes (pattern: string | string[], rootDir: string) {
  const files: string[] = await globby(pattern, { cwd: rootDir })
  return measureFiles(files, rootDir)
}

async function measureFiles (files: string[], rootDir: string) {
  let totalBytes = 0
  for (const file of files) {
    const path = join(rootDir, file)
    const isSymlink = (
      await fsp.lstat(path).catch(() => null)
    )?.isSymbolicLink()

    if (!isSymlink) {
      const bytes = Buffer.byteLength(await fsp.readFile(path))
      totalBytes += bytes
    }
  }
  return { files, totalBytes }
}

/**
 * Reads the client manifest dumped by the `build:manifest` hook in
 * `nuxt.config.ts` and returns the set of chunk file names reachable only from
 * `pages/admin/**` source keys.
 *
 * "Reachable" means the transitive static-import closure of each entry, which
 * is what the SSR renderer emits as `<link rel="modulepreload">`; anything
 * reachable from a non-admin key is subtracted so shared chunks (entry, prose
 * components, etc.) stay in the public set.
 */
async function loadAdminOnlyChunks (manifestPath: string): Promise<Set<string>> {
  const manifest = JSON.parse(
    await fsp.readFile(manifestPath, 'utf8'),
  ) as Record<string, ManifestEntry>

  function collect (key: string, into: Set<string>, seen = new Set<string>()) {
    if (seen.has(key)) return
    seen.add(key)
    const entry = manifest[key]
    if (!entry) return
    if (entry.file?.endsWith('.js')) into.add(basenameOf(entry.file))
    for (const imported of entry.imports ?? []) collect(imported, into, seen)
  }

  const adminReach = new Set<string>()
  const publicReach = new Set<string>()
  for (const key of Object.keys(manifest)) {
    // Skip the synthetic `_<chunk>.js` entries emitted for shared chunks; they
    // list themselves and would otherwise leak admin-only chunks into the
    // public set via the chunk's own metadata entry.
    if (key.startsWith('_') && key.endsWith('.js')) continue
    collect(key, key.startsWith('pages/admin/') ? adminReach : publicReach)
  }
  return new Set([...adminReach].filter(f => !publicReach.has(f)))
}

function basenameOf (file: string) {
  const slash = file.lastIndexOf('/')
  return slash === -1 ? file : file.slice(slash + 1)
}

interface ManifestEntry {
  file?: string
  imports?: string[]
}

function roundToKilobytes (bytes: number, granularityK = 1) {
  if (bytes < 100 * 1024) return (bytes / 1024).toFixed(1) + 'k'
  return Math.round(bytes / 1024 / granularityK) * granularityK + 'k'
}
