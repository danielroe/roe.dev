import { fileURLToPath } from 'node:url'

import { comarkContent } from 'comark-content'
import fsSource from 'comark-content/sources/fs'
import schemaValidation from 'comark-content/plugins/schema-validation'
import type { JsonSchema } from 'comark-content'
import { isDevelopment } from 'std-env'
import shiki from 'comark/plugins/shiki'
import palenight from 'shiki/themes/material-theme-palenight.mjs'

import { headingIds } from './modules/shared/comark-heading-ids'

/** Absolute path to the blog source directory, as the sources below resolve it. */
export const blogDir = fileURLToPath(new URL('./content/blog', import.meta.url))

/** Fields `modules/markdown.ts` derives from a document's source text at build time. */
export interface ContentMeta {
  /** The document body as plain markdown, served by the `.md` routes. */
  markdown: string
  /** The document body as HTML, used by the feeds. Blog posts only. */
  html?: string
}

const blogSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    // an unquoted YAML date parses to a `Date`, which serialises differently
    // in the templates and virtuals built from this data
    date: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    description: { type: 'string' },
    skip_dev: { type: 'boolean' },
    bluesky: { type: 'string' },
  },
  required: ['title', 'date', 'tags', 'description'],
} satisfies JsonSchema

/** The content layer behind `/blog`, the plain-markdown routes and the feeds. */
export const content = comarkContent({
  sources: {
    blog: fsSource('./content/blog', {
      prefix: '/blog',
      schema: blogSchema,
      cwd: import.meta.url,
    }),
    page: fsSource('./content', {
      // top-level documents only: a nested file would produce a path that has
      // no `pageMeta` entry and no `.md` route
      exclude: ['*/**'],
      cwd: import.meta.url,
    }),
  },
  plugins: [schemaValidation({ onError: isDevelopment ? 'warn' : 'throw' })],
  markdown: {
    plugins: [
      headingIds(),
      // code blocks always render on a dark background, so both themes match
      shiki({
        themes: { light: palenight, dark: palenight },
      }),
    ],
  },
})

export default content
