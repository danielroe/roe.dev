import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

import { addTemplate, addTypeTemplate, defineNuxtModule, updateTemplates, useNuxt } from 'nuxt/kit'
import { generateSourceTypes } from 'comark-content'
import type { ContentListFile } from 'comark-content'
import type { MarkdownDocument } from 'comark'
import type { ViteDevServer } from 'vite'

import { content } from '../content.config'
import { serialize } from './shared/serialisers'
import { mdCleanHtml, mdInternalLinks, mdStripContainers } from './shared/md-transforms'
import { tidFromDate } from './shared/tid'

type ContentDocument = ContentListFile<Record<string, any>> & {
  meta: { markdown: string, html?: string }
}

interface BlogEntry {
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
}

/** Directory each source's body templates are written to, relative to `markdown/`. */
const templateDirs = { blog: 'blog', pages: 'page' } as const
type ContentSource = keyof typeof templateDirs

// `remark`/`html-to-text` are only needed to render the feed and to feed the
// (production-only) sync providers, so both are loaded on demand
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

/**
 * Server components rendering content from the templates below. Nuxt's island
 * HMR only fires when a component's own file changes, so they have to be told
 * when the content behind them does.
 */
const contentIslands = ['StaticMarkdownRender', 'TheHome', 'TheBlogIndex']

function stripFrontmatter (raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

export default defineNuxtModule({
  meta: {
    name: 'markdown',
  },
  async setup () {
    const nuxt = useNuxt()

    /** Serialised source text per blog post path, used to build the sync payload. */
    const bodies = new Map<string, string>()
    /** Derived text per path, keyed by the source text it was derived from. */
    const derived = new Map<string, { raw: string, markdown: string, html?: string }>()

    // the plain-markdown routes and the feeds serve transformed source text
    // rather than parsed nodes, so it travels with the document
    content.hooks.hook('file:parsed', async ctx => {
      const file = ctx.file
      if (!file) return

      const raw = String(await ctx.source.getItem(`${file.meta.stem}${file.meta.extension}`))

      // the hook fires once when the manifest is built and again when the body
      // is parsed, so the transforms are memoised against the source text
      let entry = derived.get(file.path)
      if (entry?.raw !== raw) {
        const body = serialize(stripFrontmatter(raw))
        entry = ctx.sourceName === 'blog'
          ? { raw, markdown: mdInternalLinks(mdStripContainers(body)).trim(), html: await toHtml(body) }
          : { raw, markdown: mdInternalLinks(mdCleanHtml(mdStripContainers(body))) }
        derived.set(file.path, entry)
        if (ctx.sourceName === 'blog') {
          bodies.set(file.path, body)
        }
      }

      file.meta.markdown = entry.markdown
      if (entry.html) {
        file.meta.html = entry.html
      }
    })

    await content.init({ partial: true })

    let blogEntries: BlogEntry[] = []
    const trees: Record<string, MarkdownDocument> = {}
    let documents: ContentDocument[] = []

    const slugsFor = (source: ContentSource) =>
      documents.filter(doc => doc.meta.source === source).map(doc => doc.meta.stem)

    async function collect () {
      const [blog, pages] = await Promise.all([
        content.list(['blog']),
        content.list(['pages']),
      ])

      blog.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

      blogEntries = blog.map(entry => ({
        slug: entry.meta.stem,
        file: join(nuxt.options.rootDir, 'content/blog', `${entry.meta.stem}${entry.meta.extension}`),
        title: entry.data.title,
        date: entry.data.date,
        tid: tidFromDate(entry.data.date),
        tags: entry.data.tags,
        description: entry.data.description,
        path: entry.path,
        skip_dev: entry.data.skip_dev,
        bluesky: entry.data.bluesky,
      }))

      documents = [...blog, ...pages] as ContentDocument[]

      await Promise.all(documents.map(async entry => {
        const file = await content.get(entry.path)
        trees[`${entry.meta.source}/${entry.meta.stem}`] = {
          frontmatter: {},
          meta: {},
          nodes: file?.nodes ?? [],
        } as MarkdownDocument
      }))
    }

    await collect()

    async function getSyncArticles () {
      const { convert: htmlToText } = await import('html-to-text')
      return documents
        .filter(doc => doc.meta.source === 'blog' && !doc.data.skip_dev)
        .map(post => ({
          type: 'blog' as const,
          title: post.data.title,
          date: post.data.date,
          description: post.data.description || '',
          body_markdown: bodies.get(post.path)!,
          text_content: htmlToText(post.meta.html!, { wordwrap: false }),
          canonical_url: `https://roe.dev${post.path}/`,
          tags: post.data.tags.length ? post.data.tags : undefined,
        }))
    }

    nuxt.hook('modules:done', async () => {
      await Promise.all([
        nuxt.callHook('markdown:blog-entries', blogEntries),
        nuxt.callHook('markdown:sync-articles', getSyncArticles),
      ])
    })

    addTemplate({
      filename: 'markdown/blog-entries.mjs',
      getContents: () => {
        const entries = blogEntries.map(({ slug: _, file: __, ...entry }) => entry)
        return `export const blogEntries = ${JSON.stringify(entries)}`
      },
      write: true,
    })

    for (const source of Object.keys(templateDirs) as ContentSource[]) {
      const dir = templateDirs[source]

      for (const slug of slugsFor(source)) {
        addTemplate({
          filename: `markdown/${dir}/${slug}.mjs`,
          getContents: () => `const tree = ${JSON.stringify(trees[`${source}/${slug}`])}
export async function getBody () {
  return tree
}
`,
          write: true,
        })
      }

      addTemplate({
        filename: `markdown/${dir}/index.mjs`,
        getContents: () => {
          const entries = slugsFor(source)
          const imports = entries.map((slug, i) => `import { getBody as getBody${i} } from './${slug}.mjs'`)
          const loaders = entries.map((slug, i) => `  '${slug}': getBody${i},`)
          return `${imports.join('\n')}\n\nexport const ${dir}BodyLoaders = {\n${loaders.join('\n')}\n}\n`
        },
        write: true,
      })
    }

    const manifestPath = join(nuxt.options.buildDir, 'markdown/manifest.json')

    nuxt.options.nitro.virtual ||= {}
    // in dev the manifest is read back from disk so that a content change is a
    // template write rather than a rebuild of the server bundle; in production
    // it is inlined, gzipped rather than as JSON because nitro rewrites
    // `import.meta.*` in module source and posts quote it in code samples
    nuxt.options.nitro.virtual['#content-manifest'] = () => nuxt.options.dev
      ? `import { readFileSync, statSync } from 'node:fs'

const path = ${JSON.stringify(manifestPath)}
let documents, mtimeMs

export function getDocuments () {
  const stat = statSync(path)
  if (!documents || stat.mtimeMs !== mtimeMs) {
    mtimeMs = stat.mtimeMs
    documents = JSON.parse(readFileSync(path, 'utf8'))
  }
  return documents
}
`
      : `import { Buffer } from 'node:buffer'
import { gunzipSync } from 'node:zlib'

const documents = JSON.parse(gunzipSync(Buffer.from(${JSON.stringify(gzipSync(JSON.stringify(documents)).toString('base64'))}, 'base64')).toString('utf8'))

export function getDocuments () {
  return documents
}
`

    nuxt.options.nitro.externals ||= {}
    nuxt.options.nitro.externals.inline ||= []
    nuxt.options.nitro.externals.inline.push('#content-manifest')

    if (nuxt.options.dev) {
      addTemplate({
        filename: 'markdown/manifest.json',
        getContents: () => JSON.stringify(documents),
        write: true,
      })

      let vite: ViteDevServer | undefined
      nuxt.hook('vite:serverCreated', (server, env) => {
        if (env.isClient) vite = server
      })

      await content.watch()

      // a single save can surface as more than one watcher event
      let pending: ReturnType<typeof setTimeout> | undefined
      const refresh = () => {
        clearTimeout(pending)
        pending = setTimeout(async () => {
          await collect()
          await updateTemplates({
            filter: template => !!template.filename?.startsWith('markdown/'),
          })
          for (const name of contentIslands) {
            vite?.hot.send({ type: 'custom', event: `nuxt-server-component:${name}` })
          }
        }, 50)
      }

      content.hooks.hook('watch:file:update', refresh)
      content.hooks.hook('watch:file:remove', refresh)
    }

    addTypeTemplate({
      filename: 'types/content.d.ts',
      getContents: () => generateSourceTypes(content),
    }, { nuxt: true, nitro: true })

    // this module reads the sources it generates types for, so it needs the
    // registry augmentation in the node project too
    nuxt.hook('prepare:types', ({ nodeReferences }) => {
      nodeReferences.push({ path: join(nuxt.options.buildDir, 'types/content.d.ts') })
    })

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

declare module '#content-manifest' {
  export function getDocuments (): Array<Record<string, any>>
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
