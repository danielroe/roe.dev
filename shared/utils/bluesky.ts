import { withoutTrailingSlash } from 'ufo'

export const BLUESKY_API = 'https://public.api.bsky.app'

export interface BlueskyFacet {
  index: { byteStart: number, byteEnd: number }
  features: Array<{
    $type?: string
    uri?: string
    did?: string
    tag?: string
  }>
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

  // Extract links from facets
  if (post.record.facets) {
    for (const facet of post.record.facets) {
      for (const feature of facet.features) {
        if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
          links.push(feature.uri)
        }
      }
    }
  }

  // Extract links from embed
  if (post.embed?.external?.uri) {
    links.push(post.embed.external.uri)
  }

  return links
}

export function postLinksToUrl (post: BlueskyFeedPost, targetUrl: string): boolean {
  const normalizedTarget = withoutTrailingSlash(targetUrl)
  return extractLinksFromPost(post).some(link => withoutTrailingSlash(link) === normalizedTarget)
}

// Rich text parsing types
export interface TextSegment {
  text: string
  type: 'text' | 'link' | 'mention' | 'tag'
  url?: string
}

export function parseRichText (text: string, facets?: BlueskyFacet[]): TextSegment[] {
  if (!facets || facets.length === 0) {
    return [{ text, type: 'text' }]
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const bytes = encoder.encode(text)

  const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart)

  const segments: TextSegment[] = []
  let lastEnd = 0

  for (const facet of sortedFacets) {
    const { byteStart, byteEnd } = facet.index

    // Add plain text before this facet
    if (byteStart > lastEnd) {
      segments.push({
        text: decoder.decode(bytes.slice(lastEnd, byteStart)),
        type: 'text',
      })
    }

    const facetText = decoder.decode(bytes.slice(byteStart, byteEnd))
    const feature = facet.features[0]

    if (feature?.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
      segments.push({ text: facetText, type: 'link', url: feature.uri })
    }
    else if (feature?.$type === 'app.bsky.richtext.facet#mention' && feature.did) {
      segments.push({ text: facetText, type: 'mention', url: `https://bsky.app/profile/${feature.did}` })
    }
    else if (feature?.$type === 'app.bsky.richtext.facet#tag' && feature.tag) {
      segments.push({ text: facetText, type: 'tag', url: `https://bsky.app/hashtag/${feature.tag}` })
    }
    else {
      segments.push({ text: facetText, type: 'text' })
    }

    lastEnd = byteEnd
  }

  // Add remaining text after last facet
  if (lastEnd < bytes.length) {
    segments.push({
      text: decoder.decode(bytes.slice(lastEnd)),
      type: 'text',
    })
  }

  return segments
}

export function atUriToWebUrl (atUri: string): string | null {
  const match = atUri.match(/at:\/\/([^/]+)\/app\.bsky\.feed\.post\/(.+)/)
  if (!match) return null
  const [, did, rkey] = match
  return `https://bsky.app/profile/${did}/post/${rkey}`
}
