import { comarkContent } from 'comark-content'
import fsSource from 'comark-content/sources/fs'
import schemaValidation from 'comark-content/plugins/schema-validation'
import type { JsonSchema } from 'comark-content'
import { isDevelopment } from 'std-env'
import shiki from 'comark/plugins/shiki'
import palenight from 'shiki/themes/material-theme-palenight.mjs'

import { headingIds } from './modules/shared/comark-heading-ids'

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

const pageSchema = {
  type: 'object',
  properties: {},
} satisfies JsonSchema

/** The content layer behind `/blog`, the plain-markdown routes and the feeds. */
export const content = comarkContent({
  sources: {
    blog: fsSource('./content/blog', {
      prefix: '/blog',
      schema: blogSchema,
      cwd: import.meta.url,
    }),
    pages: fsSource('./content', {
      exclude: ['blog/**', '*.yml'],
      schema: pageSchema,
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
