import type { ContentListFile, SourceData } from 'comark-content'

import type { ContentMeta } from '../../content.config'
import { getDocuments } from '#content-manifest'

export type BlogPost = ContentListFile<SourceData<'blog'>, ContentMeta>
export type ContentPage = ContentListFile<SourceData<'page'>, ContentMeta>
type ContentDocument = BlogPost | ContentPage

/**
 * Documents are parsed at build time and travel as the manifest the CMS built
 * from them, so reads here are lookups rather than parses, and the markdown
 * parser stays out of the server bundle.
 *
 * The manifest is immutable in production and replaced wholesale when it
 * changes in development, so the derived views are memoised against it.
 */
let source: ContentDocument[] | undefined
let views: { posts: BlogPost[], pages: Map<string, ContentPage> }

function indexed () {
  const documents = getDocuments() as ContentDocument[]
  if (documents !== source) {
    source = documents
    views = {
      posts: documents.filter((doc): doc is BlogPost => doc.meta.source === 'blog'),
      pages: new Map(documents
        .filter((doc): doc is ContentPage => doc.meta.source === 'page')
        .map(doc => [doc.path, doc])),
    }
  }
  return views
}

/** Blog posts, newest first. */
export function blogPosts (): BlogPost[] {
  return indexed().posts
}

/** A single content page (`/ai`, `/bio`), or `undefined` if there is no such page. */
export function contentPage (path: string): ContentPage | undefined {
  return indexed().pages.get(path)
}

/** A `- [title](url) — date` line, as used by the markdown listings and `llms.txt`. */
export function blogListItem (post: BlogPost): string {
  return `- [${post.data.title}](${SITE_URL}${post.path}.md) — ${isoDate(post.data.date)}`
}
