import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

import { addTemplate, addTypeTemplate, defineNuxtModule, updateTemplates, useNuxt } from 'nuxt/kit'
import { generateSourceTypes } from 'comark-content'
import type { ContentListFile } from 'comark-content'
import type { MarkdownDocument } from 'comark'
import type { ViteDevServer } from 'vite'

import { blogDir, content } from '../content.config'
import type { ContentMeta } from '../content.config'
import { serialize } from './shared/serialisers'
import { mdCleanHtml, mdInternalLinks, mdStripContainers } from './shared/md-transforms'
import { tidFromDate } from './shared/tid'

type ContentDocument = ContentListFile<Record<string, any>, ContentMeta>

/**
 * `list()` types `meta` from the source, which knows nothing of the fields the
 * `file:parsed` hook below adds to it.
 */
function withDerivedMeta (files: Array<ContentListFile<any>>): ContentDocument[] {
  return files as unknown as ContentDocument[]
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

/** Content sources, named for the directory their body templates are written to. */
const contentSources = ['blog', 'page'] as const
type ContentSource = typeof contentSources[number]

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
 * when the content behind them does. A component that renders content and is
 * missing from this list will serve the previous body until the next reload.
 */
const contentIslands = ['StaticMarkdownRender', 'TheHome', 'TheBlogIndex']

function stripFrontmatter (raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

/** Frontmatter dates should be quoted, but an unquoted YAML date parses to a `Date`. */
function isoString (value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

/** The dev-time `#content-manifest`, re-reading the manifest template as it changes. */
function devManifestModule (path: string) {
  return `import { readFileSync, statSync } from 'node:fs'

const path = ${JSON.stringify(path)}
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
}

/**
 * The built `#content-manifest`, with the documents inlined. They are gzipped
 * rather than embedded as JSON because nitro rewrites `import.meta.*` in module
 * source and posts quote it in code samples.
 */
function inlineManifestModule (documents: ContentDocument[]) {
  const encoded = gzipSync(JSON.stringify(documents)).toString('base64')
  return `import { Buffer } from 'node:buffer'
import { gunzipSync } from 'node:zlib'

const documents = JSON.parse(gunzipSync(Buffer.from(${JSON.stringify(encoded)}, 'base64')).toString('utf8'))

export function getDocuments () {
  return documents
}
`
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
    let documents: ContentDocument[] = []
    /** Parsed body nodes, keyed by `<source>/<stem>`. Rebuilt on every collect. */
    const nodes = new Map<string, MarkdownDocument['nodes']>()

    const slugsFor = (source: ContentSource) =>
      documents.filter(doc => doc.meta.source === source).map(doc => doc.meta.stem)

    async function collect () {
      const [blog, pages] = await Promise.all([
        content.list(['blog']),
        content.list(['page']),
      ])

      blog.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

      blogEntries = blog.map(entry => {
        const date = isoString(entry.data.date)
        return {
          slug: entry.meta.stem,
          file: join(blogDir, `${entry.meta.stem}${entry.meta.extension}`),
          title: entry.data.title,
          date,
          tid: tidFromDate(date),
          tags: entry.data.tags,
          description: entry.data.description,
          path: entry.path,
          skip_dev: entry.data.skip_dev,
          bluesky: entry.data.bluesky,
        }
      })

      documents = withDerivedMeta([...blog, ...pages])

      const live = new Set(documents.map(doc => doc.path))
      for (const path of derived.keys()) {
        if (!live.has(path)) {
          derived.delete(path)
          bodies.delete(path)
        }
      }

      nodes.clear()
      await Promise.all(documents.map(async entry => {
        const file = await content.get(entry.path)
        nodes.set(`${entry.meta.source}/${entry.meta.stem}`, file?.nodes ?? [])
      }))
    }

    await collect()

    async function getSyncArticles () {
      const { convert: htmlToText } = await import('html-to-text')
      return documents
        .filter(doc => doc.meta.source === 'blog' && !doc.data.skip_dev)
        .map(post => {
          const body = bodies.get(post.path)
          if (!body || !post.meta.html) {
            throw new Error(`Refusing to sync \`${post.path}\`: no body was captured for it at build time.`)
          }
          return {
            type: 'blog' as const,
            title: post.data.title,
            date: isoString(post.data.date),
            description: post.data.description || '',
            body_markdown: body,
            text_content: htmlToText(post.meta.html, { wordwrap: false }),
            canonical_url: `https://roe.dev${post.path}/`,
            tags: post.data.tags.length ? post.data.tags : undefined,
          }
        })
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

    /**
     * One template per document body, plus an index mapping slugs to their
     * loaders. Templates are registered for documents that appear after setup
     * too, or the regenerated index would import a file that was never written.
     */
    const registeredBodies = new Set<string>()
    function registerBodyTemplates () {
      for (const source of contentSources) {
        for (const slug of slugsFor(source)) {
          const filename = `markdown/${source}/${slug}.mjs`
          if (registeredBodies.has(filename)) continue
          registeredBodies.add(filename)

          addTemplate({
            filename,
            getContents: () => `const nodes = ${JSON.stringify(nodes.get(`${source}/${slug}`) ?? [])}
export async function getBody () {
  return { nodes }
}
`,
            write: true,
          })
        }
      }
    }

    registerBodyTemplates()

    for (const source of contentSources) {
      addTemplate({
        filename: `markdown/${source}/index.mjs`,
        getContents: () => {
          const slugs = slugsFor(source)
          const imports = slugs.map((slug, i) => `import { getBody as getBody${i} } from './${slug}.mjs'`)
          const loaders = slugs.map((slug, i) => `  '${slug}': getBody${i},`)
          return `${imports.join('\n')}\n\nexport const ${source}BodyLoaders = {\n${loaders.join('\n')}\n}\n`
        },
        write: true,
      })
    }

    const manifestPath = join(nuxt.options.buildDir, 'markdown/manifest.json')

    nuxt.options.nitro.virtual ||= {}
    // in dev the manifest is read back from disk so that a content change is a
    // template write rather than a rebuild of the server bundle
    nuxt.options.nitro.virtual['#content-manifest'] = () => nuxt.options.dev
      ? devManifestModule(manifestPath)
      : inlineManifestModule(documents)

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

      const unwatch = await content.watch()

      // a single save can surface as more than one watcher event
      let pending: ReturnType<typeof setTimeout> | undefined
      const refresh = () => {
        clearTimeout(pending)
        pending = setTimeout(async () => {
          try {
            await collect()
            registerBodyTemplates()
            await updateTemplates({
              filter: template => !!template.filename?.startsWith('markdown/'),
            })
            for (const name of contentIslands) {
              vite?.hot.send({ type: 'custom', event: `nuxt-server-component:${name}` })
            }
          }
          catch (error) {
            // a throw here would take the dev server down with an unhandled
            // rejection, and the next save may well fix whatever it was
            console.error('[markdown] could not reload content', error)
          }
        }, 50)
      }

      content.hooks.hook('watch:file:update', refresh)
      content.hooks.hook('watch:file:remove', refresh)

      nuxt.hook('close', async () => {
        clearTimeout(pending)
        await unwatch()
      })
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
  export const blogBodyLoaders: Record<string, () => Promise<Pick<MarkdownDocument, 'nodes'>>>
}

declare module '#build/markdown/page/index.mjs' {
  import type { MarkdownDocument } from 'comark'
  export const pageBodyLoaders: Record<string, () => Promise<Pick<MarkdownDocument, 'nodes'>>>
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
