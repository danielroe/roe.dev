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
      },
    })
  }, 120 * 1000)

  afterAll(async () => {
    await fsp.writeFile(
      join(rootDir, '.output/test-stats.json'),
      JSON.stringify(stats, null, 2),
    )
  })

  it('default client bundle size', async () => {
    stats.client = await analyzeSizes(['**/*.js', '!_scripts/**'], publicDir)
    expect
      .soft(roundToKilobytes(stats.client.totalBytes))
      .toMatchInlineSnapshot(`"241k"`)
    expect.soft(stats.client.files.map(f => f.replace(/\..*\.js/, '.js').replace(/_scripts\/.*\.js/, '_scripts/script.js')).sort())
      .toMatchInlineSnapshot(`
        [
          "_nuxt/BlueskyComments.js",
          "_nuxt/CalSchedule.js",
          "_nuxt/ProseA.js",
          "_nuxt/ProseImg.js",
          "_nuxt/ProseTh.js",
          "_nuxt/SocialPost.js",
          "_nuxt/entry.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!node_modules'], serverDir)
    expect
      .soft(roundToKilobytes(stats.server.totalBytes, 10))
      .toMatchInlineSnapshot(`"1140k"`)

    const modules = await analyzeSizes('node_modules/**/*', serverDir)
    expect
      .soft(roundToKilobytes(modules.totalBytes, 10))
      .toMatchInlineSnapshot(`"5690k"`)

    const packages = modules.files
      .filter(m => m.endsWith('package.json'))
      .map(m => m.replace('/package.json', '').replace('node_modules/', ''))
      .sort()
    expect.soft(packages).toMatchInlineSnapshot(`
      [
        "@atcute/bluesky-richtext-segmenter",
        "@atproto/api",
        "@atproto/common-web",
        "@atproto/lex-data",
        "@atproto/lex-json",
        "@atproto/lexicon",
        "@atproto/syntax",
        "@atproto/xrpc",
        "@babel/parser",
        "@sanity/client",
        "@sanity/eventsource",
        "@sanity/webhook",
        "@vue/compiler-core",
        "@vue/compiler-core/node_modules/entities",
        "@vue/compiler-core/node_modules/entities/dist/commonjs",
        "@vue/compiler-core/node_modules/entities/dist/esm",
        "@vue/compiler-dom",
        "@vue/compiler-ssr",
        "@vue/reactivity",
        "@vue/runtime-core",
        "@vue/runtime-dom",
        "@vue/server-renderer",
        "@vue/shared",
        "await-lock",
        "comark",
        "comark/node_modules/entities",
        "consola",
        "decompress-response",
        "devalue",
        "dom-serializer",
        "dom-serializer/node_modules/entities",
        "domelementtype",
        "domhandler",
        "domutils",
        "entities",
        "estree-walker",
        "events-to-async",
        "events-to-async/module",
        "eventsource",
        "feed",
        "get-it",
        "groq",
        "hookable",
        "htmlparser2",
        "htmlparser2/node_modules/entities",
        "image-meta",
        "inherits",
        "is-retry-allowed",
        "iso-datestring-validator",
        "js-yaml",
        "linkify-it",
        "markdown-exit",
        "markdown-exit/node_modules/entities",
        "markdown-exit/node_modules/entities/dist/commonjs",
        "markdown-exit/node_modules/entities/dist/esm",
        "mdurl",
        "mimic-response",
        "multiformats",
        "nanoid",
        "nanoid/url-alphabet",
        "nuxtseo-shared",
        "partysocket",
        "perfect-debounce",
        "picomatch",
        "punycode.js",
        "radix3",
        "readable-stream",
        "rxjs",
        "safe-buffer",
        "sax",
        "source-map-js",
        "string_decoder",
        "through2",
        "tlds",
        "ts-custom-error",
        "tslib",
        "tunnel-agent",
        "uc.micro",
        "ufo",
        "uint8arrays",
        "unhead",
        "unicode-segmenter",
        "util-deprecate",
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

function roundToKilobytes (bytes: number, granularityK = 1) {
  if (bytes < 100 * 1024) return (bytes / 1024).toFixed(1) + 'k'
  return Math.round(bytes / 1024 / granularityK) * granularityK + 'k'
}
