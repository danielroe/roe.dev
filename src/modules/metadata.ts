import { readFile } from 'fs/promises'
import { createResolver, defineNuxtModule, useNuxt } from '@nuxt/kit'
import { globby } from 'globby'
import grayMatter from 'gray-matter'
import { filename } from 'pathe/utils'

export default defineNuxtModule({
  meta: {
    name: 'metadata',
  },
  async setup () {
    const nuxt = useNuxt()
    const { resolve } = createResolver(import.meta.url)
    const files = await globby(resolve('../content/blog'))
    const metadata: Record<string, any> = {}

    for (const path of files) {
      const contents = await readFile(path)
      const slug = filename(path)
      const { data } = grayMatter(contents)
      const date = new Date(data.date)
      metadata[slug] = {
        ...data,
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      }
    }

    nuxt.options.nitro.virtual = nuxt.options.nitro.virtual || {}
    nuxt.options.nitro.virtual['#metadata.json'] = () =>
      `export const metadata = ${JSON.stringify(metadata)}`
    nuxt.options.nitro.externals = nuxt.options.nitro.externals || {}
    nuxt.options.nitro.externals.inline =
      nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push('#metadata.json')
  },
})
