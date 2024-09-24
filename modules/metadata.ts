import { readFile } from 'node:fs/promises'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'

import { globby } from 'globby'
import grayMatter from 'gray-matter'
import { filename } from 'pathe/utils'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

import { serializers } from './shared/serialisers'

export default defineNuxtModule({
  meta: {
    name: 'metadata',
  },
  async setup () {
    const nuxt = useNuxt()
    const files = await globby('./content/blog/**/*.md', { cwd: nuxt.options.rootDir, absolute: true })
    const metadata: Record<string, any> = {}

    const md = remark().use(remarkHtml)

    for (const path of files) {
      let contents = await readFile(path, 'utf-8')
      const slug = filename(path)
      const { data } = grayMatter(contents)
      const date = new Date(data.date)

      for (const item of serializers) {
        contents = contents.replace(item[0], item[1])
      }

      metadata[slug] = {
        ...data,
        html: await md
          .process(contents.replace(/---[\s\S]*---/m, ''))
          .then(r => r.value),
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      }
    }

    nuxt.options.nitro.virtual = nuxt.options.nitro.virtual || {}
    nuxt.options.nitro.virtual['#metadata.json'] = () =>
      `export const metadata = ${JSON.stringify(metadata)}`
    nuxt.options.nitro.externals = nuxt.options.nitro.externals || {}
    nuxt.options.nitro.externals.inline
      = nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push('#metadata.json')
  },
})
