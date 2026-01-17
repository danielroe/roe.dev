import { withoutTrailingSlash } from 'ufo'
// @ts-expect-error virtual file
import { newestPostUrl } from 'bsky-runtime-discovery-server.mjs'

const BLUESKY_API = 'https://public.api.bsky.app'

interface BlueskyPost {
  uri: string
  record: {
    createdAt: string
    facets?: Array<{
      features: Array<{ uri?: string, $type?: string }>
    }>
  }
  embed?: {
    external?: { uri?: string }
  }
}

interface FeedResponse {
  feed: Array<{
    post: BlueskyPost
    reason?: unknown
  }>
}

export default defineEventHandler(async event => {
  if (!newestPostUrl) {
    return { uri: null }
  }

  const bskyHandle = useRuntimeConfig(event).social.networks.bluesky.identifier
  const normalizedBlogUrl = withoutTrailingSlash(newestPostUrl)

  // Fetch last 5 posts from BlueSky
  const response = await $fetch<FeedResponse>(`/xrpc/app.bsky.feed.getAuthorFeed`, {
    baseURL: BLUESKY_API,
    query: {
      actor: bskyHandle,
      limit: 5,
    },
  })

  for (const item of response.feed) {
    // Skip reposts
    if (item.reason) continue

    const post = item.post
    const links: string[] = []

    // Extract links from facets
    const facets = post.record.facets
    if (facets) {
      for (const facet of facets) {
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

    // Check if any link matches the blog URL
    const hasMatch = links.some(link => withoutTrailingSlash(link) === normalizedBlogUrl)
    if (hasMatch) {
      return { uri: post.uri }
    }
  }

  return { uri: null }
})
