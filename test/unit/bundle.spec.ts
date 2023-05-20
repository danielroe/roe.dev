/** @vitest-environment node */

import { fileURLToPath } from 'node:url'
import fsp from 'node:fs/promises'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import execa from 'execa'
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
    await execa('pnpm', ['nuxi', 'build', rootDir])
  }, 120 * 1000)

  afterAll(async () => {
    await fsp.writeFile(
      join(rootDir, '.output/test-stats.json'),
      JSON.stringify(stats, null, 2)
    )
  })

  it('default client bundle size', async () => {
    stats.client = await analyzeSizes('**/*.js', publicDir)
    expect(roundToKilobytes(stats.client.totalBytes)).toMatchInlineSnapshot(
      '"212k"'
    )
    expect(stats.client.files.map(f => f.replace(/\..*\.js/, '.js')))
      .toMatchInlineSnapshot(`
        [
          "_nuxt/ContentRendererMarkdown.js",
          "_nuxt/GridLink.js",
          "_nuxt/ProseA.js",
          "_nuxt/ProseBlockquote.js",
          "_nuxt/ProseCode.js",
          "_nuxt/ProseCodeInline.js",
          "_nuxt/ProseH2.js",
          "_nuxt/ProseH3.js",
          "_nuxt/ProseLi.js",
          "_nuxt/ProseOl.js",
          "_nuxt/ProseP.js",
          "_nuxt/ProseStrong.js",
          "_nuxt/ProseTable.js",
          "_nuxt/ProseTbody.js",
          "_nuxt/ProseTd.js",
          "_nuxt/ProseTh.js",
          "_nuxt/ProseThead.js",
          "_nuxt/ProseTr.js",
          "_nuxt/ProseUl.js",
          "_nuxt/StaticMarkdownRender.js",
          "_nuxt/_article_.js",
          "_nuxt/components-chunk.js",
          "_nuxt/dates.js",
          "_nuxt/entry.js",
          "_nuxt/index.js",
          "_nuxt/index.js",
          "_nuxt/talks.js",
          "_nuxt/uses.js",
          "_nuxt/work.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!node_modules'], serverDir)
    expect(roundToKilobytes(stats.server.totalBytes)).toMatchInlineSnapshot(
      '"715k"'
    )

    const modules = await analyzeSizes('node_modules/**/*', serverDir)
    expect(roundToKilobytes(modules.totalBytes)).toMatchInlineSnapshot(
      '"32415k"'
    )

    const packages = modules.files
      .filter(m => m.endsWith('package.json'))
      .map(m => m.replace('/package.json', '').replace('node_modules/', ''))
      .sort()
    expect(packages).toMatchInlineSnapshot(`
      [
        "@babel/parser",
        "@unhead/dom",
        "@unhead/shared",
        "@unhead/ssr",
        "@vue/compiler-core",
        "@vue/compiler-dom",
        "@vue/compiler-ssr",
        "@vue/devtools-api",
        "@vue/reactivity",
        "@vue/runtime-core",
        "@vue/runtime-dom",
        "@vue/server-renderer",
        "@vue/shared",
        "bail",
        "ccount",
        "character-entities",
        "character-entities-html4",
        "character-entities-legacy",
        "character-reference-invalid",
        "color",
        "color-convert",
        "color-name",
        "color-string",
        "comma-separated-tokens",
        "cookie-es",
        "cssfilter",
        "decode-named-character-reference",
        "defu",
        "destr",
        "detab",
        "detect-libc",
        "devalue",
        "emoticon",
        "escape-string-regexp",
        "estree-walker",
        "etag",
        "extend",
        "feed",
        "flat",
        "github-slugger",
        "h3",
        "hast-util-from-parse5",
        "hast-util-has-property",
        "hast-util-heading-rank",
        "hast-util-is-element",
        "hast-util-parse-selector",
        "hast-util-raw",
        "hast-util-to-parse5",
        "hast-util-to-string",
        "hastscript",
        "hookable",
        "html-void-elements",
        "image-meta",
        "ipx",
        "iron-webcrypto",
        "is-absolute-url",
        "is-alphabetical",
        "is-alphanumerical",
        "is-arrayish",
        "is-buffer",
        "is-decimal",
        "is-hexadecimal",
        "is-plain-obj",
        "jose",
        "jose/dist/node/esm",
        "js-yaml",
        "json5",
        "klona",
        "lodash",
        "longest-streak",
        "magic-regexp",
        "markdown-table",
        "mdast-squeeze-paragraphs",
        "mdast-util-definitions",
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
        "mdurl",
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
        "node-emoji",
        "node-fetch-native",
        "ofetch",
        "ohash",
        "parse-entities",
        "parse5",
        "pathe",
        "playwright",
        "playwright-core",
        "property-information",
        "radix3",
        "rehype-external-links",
        "rehype-raw",
        "rehype-slug",
        "rehype-sort-attribute-values",
        "rehype-sort-attributes",
        "remark-emoji",
        "remark-gfm",
        "remark-mdc",
        "remark-parse",
        "remark-rehype",
        "remark-squeeze-paragraphs",
        "sax",
        "scule",
        "semver",
        "sharp",
        "shiki-es",
        "simple-swizzle",
        "slugify",
        "source-map-js",
        "space-separated-tokens",
        "stringify-entities",
        "trim-lines",
        "trough",
        "ufo",
        "uncrypto",
        "unctx",
        "unenv",
        "unhead",
        "unified",
        "unist-builder",
        "unist-util-generated",
        "unist-util-is",
        "unist-util-position",
        "unist-util-stringify-position",
        "unist-util-visit",
        "unist-util-visit-parents",
        "unstorage",
        "vfile",
        "vfile-location",
        "vfile-message",
        "vue",
        "vue-bundle-renderer",
        "vue-router",
        "web-namespaces",
        "xml-js",
        "xss",
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
