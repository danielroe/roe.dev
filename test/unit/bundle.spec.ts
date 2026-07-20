/** @vitest-environment node */

import { pathToFileURL, fileURLToPath } from 'node:url'
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

  it('public (non-admin) client bundle size', async () => {
    const adminOnly = await loadAdminOnlyChunks(serverDir)

    const allFiles: string[] = await globby(
      ['**/*.js', '!_scripts/**', '!**/_payload.js', '!_nuxt/builds/**'],
      { cwd: publicDir },
    )
    const publicFiles = allFiles.filter(f => !adminOnly.has(basenameOf(f)))
    stats.client = await measureFiles(publicFiles, publicDir)

    expect
      .soft(roundToKilobytes(stats.client.totalBytes))
      .toMatchInlineSnapshot(`"269k"`)
    expect.soft(stats.client.files.map(f => f.replace(/\..*\.js/, '.js')).sort())
      .toMatchInlineSnapshot(`
        [
          "_nuxt/BlueskyComments.js",
          "_nuxt/CalSchedule.js",
          "_nuxt/ProseA.js",
          "_nuxt/ProseBlockquote.js",
          "_nuxt/ProseCode.js",
          "_nuxt/ProseEm.js",
          "_nuxt/ProseH1.js",
          "_nuxt/ProseH2.js",
          "_nuxt/ProseH3.js",
          "_nuxt/ProseH4.js",
          "_nuxt/ProseH5.js",
          "_nuxt/ProseH6.js",
          "_nuxt/ProseHr.js",
          "_nuxt/ProseImg.js",
          "_nuxt/ProseLi.js",
          "_nuxt/ProseOl.js",
          "_nuxt/ProseP.js",
          "_nuxt/ProsePre.js",
          "_nuxt/ProseScript.js",
          "_nuxt/ProseStrong.js",
          "_nuxt/ProseTable.js",
          "_nuxt/ProseTbody.js",
          "_nuxt/ProseTd.js",
          "_nuxt/ProseTh.js",
          "_nuxt/ProseThead.js",
          "_nuxt/ProseTr.js",
          "_nuxt/ProseUl.js",
          "_nuxt/SocialPost.js",
          "_nuxt/entry.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!node_modules'], serverDir)
    expect
      .soft(roundToKilobytes(stats.server.totalBytes, 10))
      .toMatchInlineSnapshot(`"2900k"`)

    const modules = await analyzeSizes('node_modules/**/*', serverDir)
    expect
      .soft(roundToKilobytes(modules.totalBytes, 10))
      .toMatchInlineSnapshot(`"39020k"`)

    const packages = modules.files
      .filter(m => m.endsWith('package.json'))
      .map(m => m.replace('/package.json', '').replace('node_modules/', ''))
      .sort()
    expect.soft(packages).toMatchInlineSnapshot(`
      [
        "@atcute/bluesky-richtext-segmenter",
        "@atproto-labs/did-resolver",
        "@atproto-labs/fetch",
        "@atproto-labs/fetch-node",
        "@atproto-labs/handle-resolver",
        "@atproto-labs/handle-resolver-node",
        "@atproto-labs/identity-resolver",
        "@atproto-labs/pipe",
        "@atproto-labs/simple-store",
        "@atproto-labs/simple-store-memory",
        "@atproto-labs/simple-store-memory/node_modules/lru-cache",
        "@atproto-labs/simple-store-memory/node_modules/lru-cache/dist/esm",
        "@atproto/api",
        "@atproto/common-web",
        "@atproto/did",
        "@atproto/jwk",
        "@atproto/jwk-jose",
        "@atproto/jwk-webcrypto",
        "@atproto/jwk/node_modules/multiformats",
        "@atproto/lex-data",
        "@atproto/lex-data/node_modules/multiformats",
        "@atproto/lex-json",
        "@atproto/lexicon",
        "@atproto/lexicon/node_modules/multiformats",
        "@atproto/oauth-client",
        "@atproto/oauth-client-node",
        "@atproto/oauth-client/node_modules/multiformats",
        "@atproto/oauth-types",
        "@atproto/syntax",
        "@atproto/xrpc",
        "@babel/parser",
        "@fastify/accept-negotiator",
        "@formkit/drag-and-drop",
        "@img/colour",
        "@img/sharp-libvips-linux-x64",
        "@img/sharp-linux-x64",
        "@shikijs/core",
        "@shikijs/engine-javascript",
        "@shikijs/engine-oniguruma",
        "@shikijs/langs",
        "@shikijs/primitive",
        "@shikijs/themes",
        "@shikijs/transformers",
        "@shikijs/types",
        "@shikijs/vscode-textmate",
        "@sindresorhus/is",
        "@takumi-rs/core",
        "@takumi-rs/core-linux-x64-gnu",
        "@takumi-rs/helpers",
        "@ungap/structured-clone",
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
        "await-lock",
        "bail",
        "boolbase",
        "ccount",
        "char-regex",
        "character-entities",
        "character-entities-html4",
        "character-entities-legacy",
        "character-reference-invalid",
        "comma-separated-tokens",
        "consola",
        "cookie-es",
        "core-js",
        "css-select",
        "css-select/lib/esm",
        "css-tree",
        "css-tree/node_modules/mdn-data",
        "css-what",
        "csso",
        "csso/node_modules/css-tree",
        "csso/node_modules/css-tree/node_modules/mdn-data",
        "decode-named-character-reference",
        "defu",
        "destr",
        "detab",
        "detect-libc",
        "devalue",
        "devlop",
        "dom-serializer",
        "dom-serializer/lib/esm",
        "dom-serializer/node_modules/entities",
        "dom-serializer/node_modules/entities/lib/esm",
        "domelementtype",
        "domelementtype/lib/esm",
        "domhandler",
        "domhandler/lib/esm",
        "domutils",
        "domutils/lib/esm",
        "emojilib",
        "emoticon",
        "entities",
        "entities/dist/commonjs",
        "escape-string-regexp",
        "estree-walker",
        "etag",
        "events-to-async",
        "events-to-async/module",
        "extend",
        "feed",
        "flat",
        "github-slugger",
        "h3",
        "hast-util-embedded",
        "hast-util-format",
        "hast-util-from-parse5",
        "hast-util-has-property",
        "hast-util-is-body-ok-link",
        "hast-util-is-element",
        "hast-util-minify-whitespace",
        "hast-util-parse-selector",
        "hast-util-phrasing",
        "hast-util-raw",
        "hast-util-to-html",
        "hast-util-to-mdast",
        "hast-util-to-parse5",
        "hast-util-to-string",
        "hast-util-to-text",
        "hast-util-whitespace",
        "hastscript",
        "hookable",
        "html-void-elements",
        "html-whitespace-sensitive-tag-names",
        "image-meta",
        "ipaddr.js",
        "ipx",
        "iron-webcrypto",
        "is-absolute-url",
        "is-alphabetical",
        "is-alphanumerical",
        "is-decimal",
        "is-hexadecimal",
        "is-plain-obj",
        "iso-datestring-validator",
        "jose",
        "jose/dist/node/esm",
        "longest-streak",
        "lru-cache",
        "lru-cache/dist/esm",
        "markdown-table",
        "mdast-util-find-and-replace",
        "mdast-util-from-markdown",
        "mdast-util-gfm",
        "mdast-util-gfm-autolink-literal",
        "mdast-util-gfm-footnote",
        "mdast-util-gfm-strikethrough",
        "mdast-util-gfm-table",
        "mdast-util-gfm-task-list-item",
        "mdast-util-phrasing",
        "mdast-util-to-hast",
        "mdast-util-to-markdown",
        "mdast-util-to-string",
        "mdn-data",
        "mediabunny",
        "micromark",
        "micromark-core-commonmark",
        "micromark-extension-gfm",
        "micromark-extension-gfm-autolink-literal",
        "micromark-extension-gfm-footnote",
        "micromark-extension-gfm-strikethrough",
        "micromark-extension-gfm-table",
        "micromark-extension-gfm-tagfilter",
        "micromark-extension-gfm-task-list-item",
        "micromark-factory-destination",
        "micromark-factory-label",
        "micromark-factory-space",
        "micromark-factory-title",
        "micromark-factory-whitespace",
        "micromark-util-character",
        "micromark-util-chunked",
        "micromark-util-classify-character",
        "micromark-util-combine-extensions",
        "micromark-util-decode-numeric-character-reference",
        "micromark-util-decode-string",
        "micromark-util-encode",
        "micromark-util-html-tag-name",
        "micromark-util-normalize-identifier",
        "micromark-util-resolve-all",
        "micromark-util-sanitize-uri",
        "micromark-util-subtokenize",
        "modern-screenshot",
        "multiformats",
        "node-emoji",
        "node-fetch-native",
        "node-mock-http",
        "nth-check",
        "nth-check/lib/esm",
        "nuxtseo-shared",
        "ofetch",
        "oniguruma-parser",
        "oniguruma-to-es",
        "oniguruma-to-es/dist/esm",
        "parse-entities",
        "parse5",
        "parse5/node_modules/entities",
        "parse5/node_modules/entities/dist/esm",
        "partysocket",
        "pathe",
        "perfect-debounce",
        "property-information",
        "radix3",
        "regex",
        "regex-recursion",
        "regex-utilities",
        "rehype-external-links",
        "rehype-minify-whitespace",
        "rehype-raw",
        "rehype-sort-attribute-values",
        "rehype-sort-attributes",
        "remark-emoji",
        "remark-gfm",
        "remark-mdc",
        "remark-parse",
        "remark-rehype",
        "remark-stringify",
        "sax",
        "scule",
        "semver",
        "sharp",
        "shiki",
        "skin-tone",
        "source-map-js",
        "space-separated-tokens",
        "stringify-entities",
        "svgo",
        "svgo/node_modules/css-tree",
        "svgo/node_modules/css-tree/node_modules/mdn-data",
        "tlds",
        "trim-lines",
        "trim-trailing-lines",
        "trough",
        "ts-custom-error",
        "tslib",
        "ufo",
        "uint8arrays",
        "uint8arrays/node_modules/multiformats",
        "ultrahtml",
        "uncrypto",
        "undici",
        "unhead",
        "unicode-emoji-modifier-base",
        "unicode-segmenter",
        "unified",
        "unist-util-find-after",
        "unist-util-is",
        "unist-util-position",
        "unist-util-stringify-position",
        "unist-util-visit",
        "unist-util-visit-parents",
        "vfile",
        "vfile-location",
        "vfile-message",
        "vue",
        "vue-bundle-renderer",
        "web-namespaces",
        "xml-js",
        "yaml",
        "zod",
        "zwitch",
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
 * Reads Nuxt/Nitro's precomputed client manifest (the same graph the SSR
 * renderer uses to emit `<link rel="modulepreload">` tags) and returns the
 * set of chunk file names reachable only from `pages/admin/**` source keys.
 *
 * "Reachable" here means the per-route `preload` closure that Nitro already
 * computed for us; we subtract anything reachable from any non-admin source
 * key so shared chunks (entry, mdc components, etc.) stay in the public set.
 */
async function loadAdminOnlyChunks (serverDir: string): Promise<Set<string>> {
  const manifestPath = join(serverDir, 'chunks/build/client.precomputed.mjs')
  const mod = await import(pathToFileURL(manifestPath).href) as {
    default?: { dependencies?: Record<string, ManifestDeps> }
    client_precomputed?: { dependencies?: Record<string, ManifestDeps> }
  }
  const manifest = mod.default ?? mod.client_precomputed
  const dependencies = manifest?.dependencies ?? {}

  const adminReach = new Set<string>()
  const publicReach = new Set<string>()
  for (const [key, val] of Object.entries(dependencies)) {
    // Skip the synthetic `_<chunk>.js` entries Nitro emits for shared chunks;
    // they list themselves and would otherwise leak admin-only chunks into the
    // public set via the chunk's own metadata entry.
    if (key.startsWith('_') && key.endsWith('.js')) continue
    const target = key.startsWith('pages/admin/') ? adminReach : publicReach
    for (const dep of Object.values(val.preload ?? {})) target.add(dep.file)
    for (const dep of Object.values(val.scripts ?? {})) target.add(dep.file)
  }
  return new Set([...adminReach].filter(f => !publicReach.has(f)))
}

function basenameOf (file: string) {
  const slash = file.lastIndexOf('/')
  return slash === -1 ? file : file.slice(slash + 1)
}

interface ManifestDeps {
  preload?: Record<string, { file: string }>
  scripts?: Record<string, { file: string }>
}

function roundToKilobytes (bytes: number, granularityK = 1) {
  if (bytes < 100 * 1024) return (bytes / 1024).toFixed(1) + 'k'
  return Math.round(bytes / 1024 / granularityK) * granularityK + 'k'
}
