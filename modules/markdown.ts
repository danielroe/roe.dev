import { readFile } from 'node:fs/promises'

import { addTemplate, addTypeTemplate, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { glob } from 'tinyglobby'
import grayMatter from 'gray-matter'
import { filename } from 'pathe/utils'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { convert as htmlToText } from 'html-to-text'

import { serialize } from './shared/serialisers'
import { mdCleanHtml, mdInternalLinks } from './shared/md-transforms'

interface BlogFrontmatter {
  title: string
  date: string
  tags: string[]
  description: string
  skip_dev?: boolean
  bluesky?: string
}

interface ParsedBlogPost {
  slug: string
  title: string
  date: string
  tags: string[]
  description: string
  path: string
  skip_dev?: boolean
  bluesky?: string
  body: string
}

export default defineNuxtModule({
  meta: {
    name: 'markdown',
  },
  async setup () {
    const nuxt = useNuxt()
    const rootDir = nuxt.options.rootDir

    const [blogFiles, pageFiles] = await Promise.all([
      glob('./content/blog/**/*.md', { cwd: rootDir, absolute: true }),
      glob('./content/*.md', { cwd: rootDir, absolute: true }),
    ])

    const blogPosts: ParsedBlogPost[] = []
    const pageBodies: Record<string, string> = {}

    for (const filePath of blogFiles) {
      const raw = await readFile(filePath, 'utf-8')
      const { data, content } = grayMatter(raw)
      const slug = filename(filePath)!
      const fm = data as BlogFrontmatter

      blogPosts.push({
        slug,
        title: fm.title,
        date: typeof fm.date === 'object' ? (fm.date as Date).toISOString() : fm.date,
        tags: fm.tags || [],
        description: fm.description || '',
        path: `/blog/${slug}`,
        skip_dev: fm.skip_dev,
        bluesky: fm.bluesky,
        body: content,
      })
    }

    for (const filePath of pageFiles) {
      const raw = await readFile(filePath, 'utf-8')
      const { content } = grayMatter(raw)
      const slug = filename(filePath)!
      pageBodies[slug] = content
    }

    blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    nuxt.hook('modules:done', async () => {
      await Promise.all([
        nuxt.callHook('markdown:blog-entries', blogPosts),
        nuxt.callHook('markdown:sync-articles', syncArticles),
      ])
    })

    addTemplate({
      filename: 'markdown/blog-entries.mjs',
      getContents: () => {
        const entries = blogPosts.map(({ slug: _, body: __, ...entry }) => entry)
        return `export const blogEntries = ${JSON.stringify(entries)}`
      },
      write: true,
    })

    for (const post of blogPosts) {
      addTemplate({
        filename: `markdown/blog/${post.slug}.mjs`,
        getContents: () => `
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

let _parsed
export async function getBody () {
  if (!_parsed) {
    _parsed = await parseMarkdown(${JSON.stringify(post.body)})
  }
  return _parsed
}
`,
        write: true,
      })
    }

    for (const slug of Object.keys(pageBodies)) {
      addTemplate({
        filename: `markdown/page/${slug}.mjs`,
        getContents: () => `
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

let _parsed
export async function getBody () {
  if (!_parsed) {
    _parsed = await parseMarkdown(${JSON.stringify(pageBodies[slug])})
  }
  return _parsed
}
`,
        write: true,
      })
    }

    addTemplate({
      filename: 'markdown/blog/index.mjs',
      getContents: () => {
        const imports = blogPosts.map(
          (p, i) => `import { getBody as getBody${i} } from './${p.slug}.mjs'`,
        ).join('\n')
        const entries = blogPosts.map(
          (p, i) => `  '${p.slug}': getBody${i},`,
        ).join('\n')
        return `${imports}\n\nexport const blogBodyLoaders = {\n${entries}\n}\n`
      },
      write: true,
    })

    addTemplate({
      filename: 'markdown/page/index.mjs',
      getContents: () => {
        const slugs = Object.keys(pageBodies)
        const imports = slugs.map(
          (slug, i) => `import { getBody as getBody${i} } from './${slug}.mjs'`,
        ).join('\n')
        const entries = slugs.map(
          (slug, i) => `  '${slug}': getBody${i},`,
        ).join('\n')
        return `${imports}\n\nexport const pageBodyLoaders = {\n${entries}\n}\n`
      },
      write: true,
    })

    const md = remark().use(remarkHtml)
    const rssMetadata: Record<string, any> = {}

    for (const post of blogPosts) {
      const contents = serialize(post.body)
      const date = new Date(post.date)
      rssMetadata[post.slug] = {
        title: post.title,
        description: post.description,
        tags: post.tags,
        html: await md.process(contents).then(r => r.value),
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      }
    }

    nuxt.options.nitro.virtual ||= {}
    nuxt.options.nitro.virtual['#metadata.json'] = () =>
      `export const metadata = ${JSON.stringify(rssMetadata)}`

    const syncArticles = await Promise.all(blogPosts
      .filter(p => !p.skip_dev)
      .map(async post => {
        const body = serialize(post.body)
        const date = new Date(post.date)
        const html = String(await md.process(body))
        const textContent = htmlToText(html, { wordwrap: false })
        return {
          type: 'blog' as const,
          title: post.title,
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          description: post.description || '',
          body_markdown: body,
          text_content: textContent,
          canonical_url: `https://roe.dev/blog/${post.slug}/`,
          tags: post.tags.length ? post.tags : undefined,
        }
      }))

    const rawBlogData = blogPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      date: typeof post.date === 'string' ? post.date.split('T')[0] : post.date,
      tags: post.tags,
      description: post.description,
      body: mdInternalLinks(serialize(post.body)).trim(),
    }))

    nuxt.options.nitro.virtual['#md-raw-blog.json'] = () =>
      `export const rawBlogPosts = ${JSON.stringify(rawBlogData)}`

    const rawPageData: Record<string, string> = {}
    for (const [slug, body] of Object.entries(pageBodies)) {
      rawPageData[slug] = mdInternalLinks(mdCleanHtml(serialize(body)))
    }

    nuxt.options.nitro.virtual['#md-raw-pages.json'] = () =>
      `export const rawPages = ${JSON.stringify(rawPageData)}`

    nuxt.options.nitro.externals ||= {}
    nuxt.options.nitro.externals.inline ||= []
    nuxt.options.nitro.externals.inline.push('#metadata.json', '#md-raw-blog.json', '#md-raw-pages.json')

    addTypeTemplate({
      filename: 'types/markdown.d.ts',
      getContents: () => `
declare module '#build/markdown/blog-entries.mjs' {
  interface BlogEntry {
    title: string
    date: string
    tags: string[]
    description: string
    path: string
    skip_dev?: boolean
    bluesky?: string
  }
  export const blogEntries: BlogEntry[]
}

declare module '#build/markdown/blog/index.mjs' {
  import type { MDCParserResult } from '@nuxtjs/mdc'
  export const blogBodyLoaders: Record<string, () => Promise<MDCParserResult>>
}

declare module '#build/markdown/page/index.mjs' {
  import type { MDCParserResult } from '@nuxtjs/mdc'
  export const pageBodyLoaders: Record<string, () => Promise<MDCParserResult>>
}

declare module '#md-raw-blog.json' {
  interface RawBlogPost {
    slug: string
    title: string
    date: string
    tags: string[]
    description: string
    body: string
  }
  export const rawBlogPosts: RawBlogPost[]
}

declare module '#md-raw-pages.json' {
  export const rawPages: Record<string, string>
}

declare module '#md-page-meta.json' {
  interface PageMeta {
    title: string
    description?: string
    llmLabel?: string
  }
  export const pageMeta: Record<string, PageMeta>
}

declare module '#md-pages.json' {
  export const mdPages: Set<string>
}
`,
    }, { nuxt: true, nitro: true })
  },
})

declare module '@nuxt/schema' {
  interface NuxtHooks {
    'markdown:blog-entries': (entries: Array<{ path: string, slug: string, date: string, bluesky?: string }>) => void
    'markdown:sync-articles': (articles: Array<{
      type: 'blog'
      title: string
      date: string
      description: string
      body_markdown: string
      text_content: string
      canonical_url: string
      tags?: string[]
    }>) => void
  }
}
