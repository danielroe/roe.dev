import { withoutTrailingSlash } from 'ufo'

export const BLUESKY_API = 'https://public.api.bsky.app'

export interface BlueskyFacetFeature {
  $type?: string
  uri?: string
  did?: string
  tag?: string
}

export interface BlueskyFacet {
  index: { byteStart: number, byteEnd: number }
  features: BlueskyFacetFeature[]
}

export interface BlueskyPostRecord {
  createdAt: string
  text?: string
  facets?: BlueskyFacet[]
}

export interface BlueskyEmbed {
  external?: { uri?: string }
}

export interface BlueskyFeedPost {
  uri: string
  record: BlueskyPostRecord
  embed?: BlueskyEmbed
}

export interface BlueskyFeedItem {
  post: BlueskyFeedPost
  reason?: unknown
}

export interface BlueskyFeedResponse {
  feed: BlueskyFeedItem[]
  cursor?: string
}

export function extractLinksFromPost (post: BlueskyFeedPost): string[] {
  const links: string[] = []

  if (post.record.facets) {
    for (const facet of post.record.facets) {
      for (const feature of facet.features) {
        if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
          links.push(feature.uri)
        }
      }
    }
  }

  if (post.embed?.external?.uri) {
    links.push(post.embed.external.uri)
  }

  return links
}

export function postLinksToUrl (post: BlueskyFeedPost, targetUrl: string): boolean {
  const normalizedTarget = withoutTrailingSlash(targetUrl)
  return extractLinksFromPost(post).some(link => withoutTrailingSlash(link) === normalizedTarget)
}

export function atUriToWebUrl (atUri: string): string | null {
  const match = atUri.match(/at:\/\/([^/]+)\/app\.bsky\.feed\.post\/(.+)/)
  if (!match) return null
  const [, did, rkey] = match
  return `https://bsky.app/profile/${did}/post/${rkey}`
}

export type { RichtextSegment, Facet } from '@atcute/bluesky-richtext-segmenter'
export { segmentize } from '@atcute/bluesky-richtext-segmenter'
