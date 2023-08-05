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
    await execa('pnpm', ['nuxi', 'build'], {
      cwd: rootDir,
      env: { DISABLE_PRERENDER: 'true' },
    })
  }, 120 * 1000)

  afterAll(async () => {
    await fsp.writeFile(
      join(rootDir, '.output/test-stats.json'),
      JSON.stringify(stats, null, 2)
    )
  })

  it('default client bundle size', async () => {
    stats.client = await analyzeSizes('**/*.js', publicDir)
    expect
      .soft(roundToKilobytes(stats.client.totalBytes))
      .toMatchInlineSnapshot('"186k"')
    expect.soft(stats.client.files.map(f => f.replace(/\..*\.js/, '.js')))
      .toMatchInlineSnapshot(`
        [
          "_nuxt/CalSchedule.js",
          "_nuxt/ContentRendererMarkdown.js",
          "_nuxt/NuxtTime.js",
          "_nuxt/ProseA.js",
          "_nuxt/ProseBlockquote.js",
          "_nuxt/ProseCode.js",
          "_nuxt/ProseCodeInline.js",
          "_nuxt/ProseEm.js",
          "_nuxt/ProseH2.js",
          "_nuxt/ProseH3.js",
          "_nuxt/ProseImg.js",
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
          "_nuxt/SocialPost.js",
          "_nuxt/_article_.js",
          "_nuxt/entry.js",
          "_nuxt/feed.js",
          "_nuxt/index.js",
          "_nuxt/index.js",
          "_nuxt/talks.js",
          "_nuxt/uses.js",
          "_nuxt/voted.js",
          "_nuxt/work.js",
        ]
      `)
  })

  it('default server bundle size', async () => {
    stats.server = await analyzeSizes(['**/*.mjs', '!node_modules'], serverDir)
    expect
      .soft(roundToKilobytes(stats.server.totalBytes))
      .toMatchInlineSnapshot('"393k"')

    const modules = await analyzeSizes('node_modules/**/*', serverDir)
    expect
      .soft(roundToKilobytes(modules.totalBytes))
      .toMatchInlineSnapshot('"27574k"')

    const packages = modules.files
      .filter(m => m.endsWith('package.json'))
      .map(m => m.replace('/package.json', '').replace('node_modules/', ''))
      .sort()
    expect.soft(packages).toMatchInlineSnapshot(`
      [
        "@atproto/api",
        "@fastify/accept-negotiator",
        "abort-controller",
        "asynckit",
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
        "combined-stream",
        "comma-separated-tokens",
        "consola",
        "cookie-es",
        "cssfilter",
        "debug",
        "decode-named-character-reference",
        "defu",
        "delayed-stream",
        "destr",
        "detab",
        "detect-libc",
        "emoticon",
        "escape-string-regexp",
        "etag",
        "event-target-shim",
        "extend",
        "feed",
        "flat",
        "form-data",
        "github-slugger",
        "h3",
        "h3/node_modules/destr",
        "has-flag",
        "hast-util-from-parse5",
        "hast-util-has-property",
        "hast-util-heading-rank",
        "hast-util-is-element",
        "hast-util-parse-selector",
        "hast-util-raw",
        "hast-util-raw/node_modules/unist-util-position",
        "hast-util-raw/node_modules/unist-util-visit",
        "hast-util-raw/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "hast-util-raw/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "hast-util-to-parse5",
        "hast-util-to-string",
        "hastscript",
        "hookable",
        "html-void-elements",
        "http-graceful-shutdown",
        "image-meta",
        "ipx",
        "ipx/node_modules/destr",
        "iron-webcrypto",
        "is-absolute-url",
        "is-alphabetical",
        "is-alphanumerical",
        "is-arrayish",
        "is-buffer",
        "is-decimal",
        "is-hexadecimal",
        "is-plain-obj",
        "js-yaml",
        "json5",
        "klona",
        "lodash",
        "longest-streak",
        "markdown-table",
        "mdast-squeeze-paragraphs",
        "mdast-squeeze-paragraphs/node_modules/unist-util-visit",
        "mdast-squeeze-paragraphs/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "mdast-squeeze-paragraphs/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "mdast-util-definitions",
        "mdast-util-definitions/node_modules/unist-util-visit",
        "mdast-util-definitions/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "mdast-util-definitions/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "mdast-util-find-and-replace",
        "mdast-util-find-and-replace/node_modules/unist-util-is",
        "mdast-util-find-and-replace/node_modules/unist-util-visit-parents",
        "mdast-util-find-and-replace/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "mdast-util-from-markdown",
        "mdast-util-from-markdown/node_modules/unist-util-stringify-position",
        "mdast-util-gfm",
        "mdast-util-gfm-autolink-literal",
        "mdast-util-gfm-footnote",
        "mdast-util-gfm-strikethrough",
        "mdast-util-gfm-table",
        "mdast-util-gfm-task-list-item",
        "mdast-util-phrasing",
        "mdast-util-phrasing/node_modules/unist-util-is",
        "mdast-util-to-hast",
        "mdast-util-to-hast/node_modules/unist-util-position",
        "mdast-util-to-hast/node_modules/unist-util-visit",
        "mdast-util-to-hast/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "mdast-util-to-hast/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "mdast-util-to-markdown",
        "mdast-util-to-markdown/node_modules/unist-util-visit",
        "mdast-util-to-markdown/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "mdast-util-to-markdown/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
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
        "mime-db",
        "mime-types",
        "ms",
        "node-emoji",
        "node-fetch-native",
        "ofetch",
        "ofetch/node_modules/destr",
        "ohash",
        "parse-entities",
        "parse5",
        "pathe",
        "property-information",
        "radix3",
        "rehype-external-links",
        "rehype-external-links/node_modules/unist-util-visit",
        "rehype-external-links/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "rehype-external-links/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "rehype-raw",
        "rehype-slug",
        "rehype-slug/node_modules/unist-util-visit",
        "rehype-slug/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "rehype-slug/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "rehype-sort-attribute-values",
        "rehype-sort-attribute-values/node_modules/unist-util-visit",
        "rehype-sort-attribute-values/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "rehype-sort-attribute-values/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "rehype-sort-attributes",
        "rehype-sort-attributes/node_modules/unist-util-visit",
        "rehype-sort-attributes/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "rehype-sort-attributes/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "remark-emoji",
        "remark-gfm",
        "remark-mdc",
        "remark-mdc/node_modules/unist-util-visit",
        "remark-mdc/node_modules/unist-util-visit/node_modules/unist-util-visit-parents",
        "remark-mdc/node_modules/unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
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
        "space-separated-tokens",
        "stringify-entities",
        "supports-color",
        "trim-lines",
        "trough",
        "ufo",
        "uncrypto",
        "unenv",
        "unified",
        "unist-builder",
        "unist-util-generated",
        "unist-util-is",
        "unist-util-position",
        "unist-util-stringify-position",
        "unist-util-visit",
        "unist-util-visit-parents",
        "unist-util-visit-parents/node_modules/unist-util-is",
        "unist-util-visit/node_modules/unist-util-visit-parents",
        "unist-util-visit/node_modules/unist-util-visit-parents/node_modules/unist-util-is",
        "unstorage",
        "unstorage/node_modules/destr",
        "vfile",
        "vfile-location",
        "vfile-message",
        "vfile-message/node_modules/unist-util-stringify-position",
        "web-namespaces",
        "xml-js",
        "xss",
        "zwitch",
      ]
    `)
  })
})

async function analyzeSizes(pattern: string | string[], rootDir: string) {
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

function roundToKilobytes(bytes: number) {
  return (bytes / 1024).toFixed(bytes > 100 * 1024 ? 0 : 1) + 'k'
}
