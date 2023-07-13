import { readFile } from 'fs/promises'
import { createResolver, defineNuxtModule, useNuxt } from '@nuxt/kit'
import { globby } from 'globby'
import grayMatter from 'gray-matter'
import { filename } from 'pathe/utils'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const serializers = new Map([
  [/\(\//g, '(https://roe.dev/'],
  [/ ---? /g, ' — '],
  [/::SocialPost\{link=([^ ]*)[\s\S]*?::/g, '$1'],
  [/:CalSchedule\{meeting=([^ ]*).*\}/g, 'https://cal.com/danielroe/$1'],
  [/(\n|^)---\n[\s\S]*\n---\n/, '\n'],
])

export default defineNuxtModule({
  meta: {
    name: 'metadata',
  },
  async setup() {
    const nuxt = useNuxt()
    const { resolve } = createResolver(import.meta.url)
    const files = await globby(resolve('../content/blog'))
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
    nuxt.options.nitro.externals.inline =
      nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push('#metadata.json')
  },
})
