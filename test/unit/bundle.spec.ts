/** @vitest-environment node */

import { fileURLToPath } from 'node:url'
import fsp from 'node:fs/promises'
import { execSync } from 'node:child_process'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { globby } from 'globby'
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
      env: { ...process.env, NODE_ENV: 'production', DISABLE_PRERENDER: 'true' },
    })
  }, 120 * 1000)

  afterAll(async () => {
    await fsp.writeFile(
      join(rootDir, '.output/test-stats.json'),
      JSON.stringify(stats, null, 2),
    )
  })

  it('default client bundle size', async () => {
    stats.client = await analyzeSizes('**/*.js', publicDir)
    expect
      .soft(roundToKilobytes(stats.client.totalBytes))
      .toMatchInlineSnapshot(`"453k"`)
    expect.soft(stats.client.files.map(f => f.replace(/\..*\.js/, '.js').replace(/_scripts\/.*\.js/, '_scripts/script.js')).sort())
      .toMatchInlineSnapshot(`
        [
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
          "_nuxt/sqlite3-opfs-async-proxy-MFda9Fch.js",
          "_nuxt/sqlite3-worker1-bundler-friendly-Ca5tXwC4.js",
          "_scripts/script.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!node_modules'], serverDir)
    expect
      .soft(roundToKilobytes(stats.server.totalBytes))
      .toMatchInlineSnapshot(`"433k"`)

    const modules = await analyzeSizes('node_modules/**/*', serverDir)
    expect
      .soft(roundToKilobytes(modules.totalBytes))
      .toMatchInlineSnapshot(`"18931k"`)

    const packages = modules.files
      .filter(m => m.endsWith('package.json'))
      .map(m => m.replace('/package.json', '').replace('node_modules/', ''))
      .sort()
    expect.soft(packages).toMatchInlineSnapshot(`
      [
        "@atproto/api",
        "@atproto/common-web",
        "@atproto/lexicon",
        "@atproto/syntax",
        "@atproto/xrpc",
        "@babel/parser",
        "@jridgewell/sourcemap-codec",
        "@sanity/client",
        "@sanity/eventsource",
        "@shikijs/core",
        "@shikijs/engine-javascript",
        "@shikijs/engine-oniguruma",
        "@shikijs/langs",
        "@shikijs/themes",
        "@shikijs/transformers",
        "@shikijs/types",
        "@shikijs/vscode-textmate",
        "@sindresorhus/is",
        "@ungap/structured-clone",
        "@unhead/dom",
        "@unhead/shared",
        "@unhead/ssr",
        "@unocss/core",
        "@unocss/extractor-arbitrary-variants",
        "@unocss/preset-mini",
        "@unocss/preset-wind3",
        "@unocss/rule-utils",
        "@vue/compiler-core",
        "@vue/compiler-dom",
        "@vue/reactivity",
        "@vue/runtime-core",
        "@vue/runtime-dom",
        "@vue/shared",
        "await-lock",
        "bail",
        "better-sqlite3",
        "bindings",
        "ccount",
        "char-regex",
        "character-entities",
        "character-entities-html4",
        "character-entities-legacy",
        "character-reference-invalid",
        "comma-separated-tokens",
        "consola",
        "core-util-is",
        "cssfilter",
        "debug",
        "decode-named-character-reference",
        "decompress-response",
        "detab",
        "devalue",
        "devlop",
        "emoji-regex-xs",
        "emojilib",
        "emoticon",
        "entities",
        "entities/lib/esm",
        "escape-string-regexp",
        "estree-walker",
        "events-to-async",
        "events-to-async/module",
        "eventsource",
        "extend",
        "feed",
        "file-uri-to-path",
        "flat",
        "follow-redirects",
        "get-it",
        "github-slugger",
        "graphemer",
        "hast-util-embedded",
        "hast-util-format",
        "hast-util-from-parse5",
        "hast-util-from-parse5/node_modules/property-information",
        "hast-util-has-property",
        "hast-util-is-body-ok-link",
        "hast-util-is-element",
        "hast-util-minify-whitespace",
        "hast-util-parse-selector",
        "hast-util-phrasing",
        "hast-util-raw",
        "hast-util-to-html",
        "hast-util-to-html/node_modules/property-information",
        "hast-util-to-mdast",
        "hast-util-to-parse5",
        "hast-util-to-parse5/node_modules/property-information",
        "hast-util-to-string",
        "hast-util-to-text",
        "hast-util-whitespace",
        "hastscript",
        "hastscript/node_modules/property-information",
        "hookable",
        "html-void-elements",
        "html-whitespace-sensitive-tag-names",
        "image-meta",
        "inherits",
        "is-absolute-url",
        "is-alphabetical",
        "is-alphanumerical",
        "is-decimal",
        "is-hexadecimal",
        "is-plain-obj",
        "is-retry-allowed",
        "isarray",
        "iso-datestring-validator",
        "longest-streak",
        "lru-cache",
        "lru-cache/dist/esm",
        "magic-string",
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
        "mimic-response",
        "ms",
        "multiformats",
        "node-emoji",
        "node-mock-http",
        "oniguruma-to-es",
        "oniguruma-to-es/dist/esm",
        "packrup",
        "parse-entities",
        "parse5",
        "process-nextick-args",
        "progress-stream",
        "property-information",
        "readable-stream",
        "readable-stream/node_modules/safe-buffer",
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
        "rxjs",
        "safe-buffer",
        "sax",
        "scule",
        "shiki",
        "skin-tone",
        "source-map-js",
        "space-separated-tokens",
        "speedometer",
        "string_decoder",
        "string_decoder/node_modules/safe-buffer",
        "stringify-entities",
        "supports-color",
        "through2",
        "tlds",
        "trim-lines",
        "trim-trailing-lines",
        "trough",
        "ts-custom-error",
        "tunnel-agent",
        "tunnel-agent/node_modules/safe-buffer",
        "uint8arrays",
        "unhead",
        "unicode-emoji-modifier-base",
        "unified",
        "unist-util-find-after",
        "unist-util-is",
        "unist-util-position",
        "unist-util-stringify-position",
        "unist-util-visit",
        "unist-util-visit-parents",
        "util-deprecate",
        "vfile",
        "vfile-location",
        "vfile-message",
        "vue",
        "web-namespaces",
        "xml-js",
        "xss",
        "xtend",
        "yaml",
        "zod",
        "zwitch",
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

function roundToKilobytes (bytes: number) {
  return (bytes / 1024).toFixed(bytes > 100 * 1024 ? 0 : 1) + 'k'
}
