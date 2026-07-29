import type { ContentListFile, SourceData } from 'comark-content'

import { getDocuments } from '#content-manifest'

/** Fields `modules/markdown.ts` derives from the source text at build time. */
interface ContentMeta {
  /** The document body as plain markdown, served by the `.md` routes. */
  markdown: string
  /** The document body as HTML, used by the feeds. Blog posts only. */
  html?: string
}

export type BlogPost = ContentListFile<SourceData<'blog'>> & { meta: ContentMeta }
export type ContentPage = ContentListFile<SourceData<'pages'>> & { meta: ContentMeta }

/**
 * Documents are parsed at build time and travel as the manifest the CMS built
 * from them, so reads here are lookups rather than parses, and the markdown
 * parser stays out of the server bundle.
 */
const documents = () => getDocuments() as Array<BlogPost | ContentPage>

/** Blog posts, newest first. */
export function blogPosts (): BlogPost[] {
  return documents().filter((doc): doc is BlogPost => doc.meta.source === 'blog')
}

/** A single content page (`/ai`, `/bio`), or `undefined` if there is no such page. */
export function contentPage (path: string): ContentPage | undefined {
  return documents().find((doc): doc is ContentPage => doc.meta.source === 'pages' && doc.path === path)
}

/** A `- [title](url) — date` line, as used by the markdown listings and `llms.txt`. */
export function blogListItem (post: BlogPost): string {
  return `- [${post.data.title}](${SITE_URL}${post.path}.md) — ${isoDate(post.data.date)}`
}
