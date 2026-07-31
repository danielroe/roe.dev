import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

import { addTemplate, addTypeTemplate, defineNuxtModule, updateTemplates, useNuxt } from 'nuxt/kit'
import { generateSourceTypes } from '@comark/cms'
import type { CMSListFile } from '@comark/cms'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { convert as htmlToText } from 'html-to-text'
import type { ComarkTree } from 'comark'
import type { ViteDevServer } from 'vite'

import { contentCMS } from '../content.config'
import { serialize } from './shared/serialisers'
import { mdCleanHtml, mdInternalLinks, mdStripContainers } from './shared/md-transforms'
import { tidFromDate } from './shared/tid'

type ContentDocument = CMSListFile<Record<string, any>> & {
  meta: { markdown: string, html?: string }
}

interface BlogEntry {
  slug: string
  title: string
  date: string
  tid: string
  tags: string[]
  description: string
  path: string
  skip_dev?: boolean
  bluesky?: string
}

const md = remark().use(remarkHtml)

/** Directory each source's body templates are written to, relative to `markdown/`. */
const templateDirs = { blog: 'blog', pages: 'page' } as const
type ContentSource = keyof typeof templateDirs

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
    const cms = contentCMS

    /** Serialised source text per blog post path, used to build the sync payload. */
    const bodies = new Map<string, string>()

    // the plain-markdown routes and the feeds serve transformed source text
    // rather than parsed nodes, so it travels with the document
    cms.hooks.hook('file:parsed', async ctx => {
      const file = ctx.file
      if (!file) return

      const raw = String(await ctx.source.getItem(`${file.meta.stem}${file.meta.extension}`))
      const body = serialize(stripFrontmatter(raw))

      if (ctx.sourceName === 'blog') {
        bodies.set(file.path, body)
        file.meta.markdown = mdInternalLinks(mdStripContainers(body)).trim()
        file.meta.html = String(await md.process(body))
      }
      else {
        file.meta.markdown = mdInternalLinks(mdCleanHtml(mdStripContainers(body)))
      }
    })

    await cms.init({ metaOnly: true })

    let blogEntries: BlogEntry[] = []
    const trees: Record<string, ComarkTree> = {}
    let documents: ContentDocument[] = []

    const slugsFor = (source: ContentSource) =>
      documents.filter(doc => doc.meta.source === source).map(doc => doc.meta.stem)

    async function collect () {
      const [blog, pages] = await Promise.all([
        cms.list(['blog']),
        cms.list(['pages']),
      ])

      blog.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

      blogEntries = blog.map(entry => ({
        slug: entry.meta.stem,
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
        const file = await cms.get(entry.path)
        trees[`${entry.meta.source}/${entry.meta.stem}`] = {
          frontmatter: {},
          meta: {},
          nodes: file?.nodes ?? [],
        }
      }))
    }

    await collect()

    const syncArticles = documents
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

    nuxt.hook('modules:done', async () => {
      await Promise.all([
        nuxt.callHook('markdown:blog-entries', blogEntries),
        nuxt.callHook('markdown:sync-articles', syncArticles),
      ])
    })

    addTemplate({
      filename: 'markdown/blog-entries.mjs',
      getContents: () => {
        const entries = blogEntries.map(({ slug: _, ...entry }) => entry)
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

      await cms.watch()

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

      cms.hooks.hook('watch:file:update', refresh)
      cms.hooks.hook('watch:file:remove', refresh)
    }

    addTypeTemplate({
      filename: 'types/content.d.ts',
      getContents: () => generateSourceTypes(cms),
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
  import type { ComarkTree } from 'comark'
  export const blogBodyLoaders: Record<string, () => Promise<ComarkTree>>
}

declare module '#build/markdown/page/index.mjs' {
  import type { ComarkTree } from 'comark'
  export const pageBodyLoaders: Record<string, () => Promise<ComarkTree>>
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
