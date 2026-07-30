/** @vitest-environment node */

import { fileURLToPath } from 'node:url'
import fsp from 'node:fs/promises'
import { execSync } from 'node:child_process'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { glob as globby } from 'tinyglobby'
import { join } from 'pathe'

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
      .toMatchInlineSnapshot(`"262k"`)
    expect.soft(stats.client.files.map(f => f.replace(/\..*\.js/, '.js')).sort())
      .toMatchInlineSnapshot(`
        [
          "_nuxt/BlueskyComments.js",
          "_nuxt/entry.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!_libs/**'], serverDir)
    expect
      .soft(roundToKilobytes(stats.server.totalBytes, 10))
      .toMatchInlineSnapshot(`"990k"`)

    const libs = await analyzeSizes('_libs/**/*', serverDir)
    expect
      .soft(roundToKilobytes(libs.totalBytes, 10))
      .toMatchInlineSnapshot(`"6710k"`)

    const packages = libs.files
      .map(f => f.replace('_libs/', '').replace(/(?:\+\[\.\.\.\])?\.mjs$/, ''))
      .sort()
    expect.soft(packages).toMatchInlineSnapshot(`
      [
        "@atproto-labs/did-resolver",
        "@atproto-labs/fetch-node",
        "@atproto-labs/handle-resolver-node",
        "@atproto-labs/identity-resolver",
        "@atproto/api",
        "@atproto/oauth-client",
        "@formkit/drag-and-drop",
        "@nuxt/image",
        "@nuxt/nitro-server",
        "@takumi-rs/core",
        "atproto-labs__handle-resolver",
        "atproto__jwk",
        "atproto__jwk-jose+jose",
        "atproto__jwk-webcrypto",
        "atproto__oauth-client-node",
        "boolbase",
        "comark",
        "consola",
        "cookie-es",
        "css-select",
        "css-tree+source-map-js",
        "csso",
        "detect-libc",
        "devalue",
        "fastify__accept-negotiator",
        "gsap",
        "img__colour",
        "klona",
        "mocked-exports",
        "node-fetch-native",
        "nuxt-og-image",
        "nuxt__devalue",
        "partysocket",
        "sax",
        "semver",
        "sharp",
        "svgo",
        "unctx",
        "unhead",
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
