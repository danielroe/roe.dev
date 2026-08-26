import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { addTemplate, addTypeTemplate, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { glob } from 'tinyglobby'
import grayMatter from 'gray-matter'
import { filename } from 'pathe/utils'
import { createMarkdownParser } from 'comark/parse'
import shiki from 'comark/plugins/shiki'
import palenight from 'shiki/themes/material-theme-palenight.mjs'

import { createBuildCache, hashKey } from './shared/build-cache'
import { headingIds } from './shared/comark-heading-ids'
import { serialize } from './shared/serialisers'
import { mdCleanHtml, mdInternalLinks, mdStripContainers } from './shared/md-transforms'
import { tidFromDate } from './shared/tid'

/**
 * Bumped whenever the shape of a cached syntax-highlighted tree changes; the
 * resolved `comark`/`shiki` versions are folded in so a dependency bump
 * invalidates the cache without needing to remember to touch this.
 */
const TREE_CACHE_VERSION = [
  '1',
  ...['comark', 'shiki'].map(name => {
    try {
      return createRequire(import.meta.url)(`${name}/package.json`).version as string
    }
    catch {
      return name
    }
  }),
].join('-')

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
  file: string
  title: string
  date: string
  tid: string
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
      const date = typeof fm.date === 'object' ? (fm.date as Date).toISOString() : fm.date

      blogPosts.push({
        slug,
        file: filePath,
        title: fm.title,
        date,
        tid: tidFromDate(date),
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
        nuxt.callHook('markdown:sync-articles', getSyncArticles),
      ])
    })

    addTemplate({
      filename: 'markdown/blog-entries.mjs',
      getContents: () => {
        const entries = blogPosts.map(({ slug: _, file: __, body: ___, ...entry }) => entry)
        return `export const blogEntries = ${JSON.stringify(entries)}`
      },
      write: true,
    })

    const parse = createMarkdownParser({
      plugins: [
        headingIds(),
        // code blocks always render on a dark background, so both themes match
        shiki({
          themes: { light: palenight, dark: palenight },
        }),
      ],
    })

    const treeCache = createBuildCache('markdown-trees')
    async function parseCached (body: string) {
      const key = hashKey(TREE_CACHE_VERSION, body)
      const cached = await treeCache.get<unknown>(key)
      if (cached) return cached.value
      const tree = await parse(body)
      await treeCache.set(key, tree)
      return tree
    }

    function addBodyTemplate (filename: string, tree: unknown) {
      addTemplate({
        filename,
        getContents: () => `const tree = ${JSON.stringify(tree)}
export async function getBody () {
  return tree
}
`,
        write: true,
      })
    }

    await Promise.all([
      ...blogPosts.map(async post => {
        addBodyTemplate(`markdown/blog/${post.slug}.mjs`, await parseCached(post.body))
      }),
      ...Object.entries(pageBodies).map(async ([slug, body]) => {
        addBodyTemplate(`markdown/page/${slug}.mjs`, await parseCached(body))
      }),
    ])

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

    // `remark`/`html-to-text` are only needed to render the feed and to feed
    // the (production-only) sync providers, so both are loaded on demand
    let markdownToHtml: ((markdown: string) => Promise<string>) | undefined
    async function toHtml (markdown: string) {
      if (!markdownToHtml) {
        const [{ remark }, { default: remarkHtml }] = await Promise.all([
          import('remark'),
          import('remark-html'),
        ])
        const md = remark().use(remarkHtml)
        markdownToHtml = async source => String(await md.process(source))
      }
      return markdownToHtml(markdown)
    }

    nuxt.options.nitro.virtual ||= {}
    nuxt.options.nitro.virtual['#metadata.json'] = async () => {
      const rssMetadata: Record<string, unknown> = {}
      for (const post of blogPosts) {
        const date = new Date(post.date)
        rssMetadata[post.slug] = {
          title: post.title,
          description: post.description,
          tags: post.tags,
          html: await toHtml(serialize(post.body)),
          date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        }
      }
      return `export const metadata = ${JSON.stringify(rssMetadata)}`
    }

    async function getSyncArticles () {
      const { convert: htmlToText } = await import('html-to-text')
      return Promise.all(blogPosts
        .filter(p => !p.skip_dev)
        .map(async post => {
          const body = serialize(post.body)
          const html = await toHtml(body)
          return {
            type: 'blog' as const,
            title: post.title,
            date: post.date,
            description: post.description || '',
            body_markdown: body,
            text_content: htmlToText(html, { wordwrap: false }),
            canonical_url: `https://roe.dev/blog/${post.slug}/`,
            tags: post.tags.length ? post.tags : undefined,
          }
        }))
    }

    const rawBlogData = blogPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      date: typeof post.date === 'string' ? post.date.split('T')[0] : post.date,
      tags: post.tags,
      description: post.description,
      body: mdInternalLinks(mdStripContainers(serialize(post.body))).trim(),
    }))

    nuxt.options.nitro.virtual['#md-raw-blog.json'] = () =>
      `export const rawBlogPosts = ${JSON.stringify(rawBlogData)}`

    const rawPageData: Record<string, string> = {}
    for (const [slug, body] of Object.entries(pageBodies)) {
      rawPageData[slug] = mdInternalLinks(mdCleanHtml(mdStripContainers(serialize(body))))
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
    tid: string
    tags: string[]
    description: string
    path: string
    skip_dev?: boolean
    bluesky?: string
  }
  export const blogEntries: BlogEntry[]
}

declare module '#build/markdown/blog/index.mjs' {
  import type { MarkdownDocument } from 'comark'
  export const blogBodyLoaders: Record<string, () => Promise<MarkdownDocument>>
}

declare module '#build/markdown/page/index.mjs' {
  import type { MarkdownDocument } from 'comark'
  export const pageBodyLoaders: Record<string, () => Promise<MarkdownDocument>>
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
    'markdown:blog-entries': (entries: Array<{ path: string, slug: string, file: string, date: string, bluesky?: string }>) => void
    /**
     * Receives a lazy getter rather than the articles themselves: rendering
     * them costs markdown -> HTML -> text for every post, and only the
     * (production-only) sync module ever asks for them.
     */
    'markdown:sync-articles': (getArticles: () => Promise<Array<{
      type: 'blog'
      title: string
      date: string
      description: string
      body_markdown: string
      text_content: string
      canonical_url: string
      tags?: string[]
    }>>) => void
  }
}
