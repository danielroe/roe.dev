import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import { joinURL, withoutTrailingSlash } from 'ufo'
import { join } from 'pathe'
import { AtpAgent, AppBskyFeedPost } from '@atproto/api'

// when I created my Bluesky account - don't judge me for hard coding it!
const BLUESKY_ACCOUNT_CREATED = new Date('2023-04-26T05:22:14.855Z')

interface ParsedPost {
  uri: string
  createdAt: string
  links: string[] // URLs found in facets and embeds
}

export default defineNuxtModule({
  meta: {
    name: 'bsky-comments',
  },
  setup () {
    const nuxt = useNuxt()
    if (nuxt.options._prepare) {
      return
    }

    const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })

    const cacheDir = join(nuxt.options.rootDir, 'node_modules', '.cache', 'bluesky-comments')
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }
    const blueskyHandle = nuxt.options.social.networks.bluesky!.identifier

    // Shared feed iterator - fetches posts on demand and grows as needed
    const feedIterator = createFeedIterator(agent, blueskyHandle)

    nuxt.hook('content:file:afterParse', async ctx => {
      const content = ctx.content as { path?: string, date?: string | Date, bluesky?: string }

      if (!content.path?.startsWith('/blog/')) return

      const blogPath = content.path
      const blogUrl = withoutTrailingSlash(joinURL(nuxt.options.site.url, blogPath))

      const safeName = blogPath.replace(/[^a-z0-9]/gi, '-')
      const cacheFile = join(cacheDir, `${safeName}.json`)

      if (existsSync(cacheFile)) {
        try {
          const cached = JSON.parse(readFileSync(cacheFile, 'utf-8')) as { uri: string | null }
          if (cached.uri) {
            content.bluesky = cached.uri
          }
          return
        }
        catch {
          // Continue to fetch
        }
      }

      let discoveredUri: string | null = null

      // 1. explicit bluesky URL in frontmatter - simply resolve
      if (content.bluesky?.startsWith('https://bsky.app/')) {
        const match = content.bluesky.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/)
        if (match) {
          const [, handle, rkey] = match
          try {
            const { data } = await agent.resolveHandle({ handle: handle! })
            content.bluesky = `at://${data.did}/app.bsky.feed.post/${rkey}`
            discoveredUri = content.bluesky
          }
          catch (error) {
            console.warn(`Failed to resolve Bluesky handle for ${blogPath}:`, error)
          }
        }
        saveCache(cacheDir, cacheFile, discoveredUri)
      }

      // 2. auto-discover posts linking to this blog URL
      const blogDate = content.date ? new Date(content.date) : null

      if (blogDate && blogDate < BLUESKY_ACCOUNT_CREATED) {
        saveCache(cacheDir, cacheFile, null)
        return
      }

      const searchCutoff = blogDate
        ? new Date(blogDate.getTime() - 24 * 60 * 60 * 1000)
        : BLUESKY_ACCOUNT_CREATED

      while (!feedIterator.isExhausted()) {
        const oldestFetchedDate = feedIterator.getOldestPostDate()
        if (oldestFetchedDate && oldestFetchedDate < searchCutoff) {
          break
        }
        await feedIterator.fetchMore()
      }

      const matchingPosts: ParsedPost[] = []
      for (const post of feedIterator.posts) {
        const postDate = new Date(post.createdAt)
        const hasMatchingLink = post.links.some(link => withoutTrailingSlash(link) === blogUrl)
        if (postDate >= searchCutoff && hasMatchingLink) {
          matchingPosts.push(post)
        }
      }

      if (matchingPosts.length > 0) {
        // Sort by `createdAt` ascending to get the first announcement)
        matchingPosts.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        content.bluesky = matchingPosts[0]!.uri
        discoveredUri = content.bluesky
        console.log(`Auto-discovered Bluesky post for ${blogPath}`)
      }

      saveCache(cacheDir, cacheFile, discoveredUri)
    })
  },
})

function saveCache (cacheDir: string, cacheFile: string, uri: string | null) {
  try {
    writeFileSync(cacheFile, JSON.stringify({ uri }))
  }
  catch {
    // Ignore cache write errors
  }
}

function createFeedIterator (agent: AtpAgent, actor: string) {
  const posts: ParsedPost[] = []
  let cursor: string | undefined
  let exhausted = false
  let oldestPostDate: Date | null = null

  async function fetchNextPage (): Promise<boolean> {
    if (exhausted) return false

    try {
      const { data } = await agent.getAuthorFeed({
        actor,
        limit: 100,
        cursor,
      })

      for (const item of data.feed) {
        // skip reposts
        if (item.reason) continue

        const post = item.post
        if (!AppBskyFeedPost.isRecord(post.record)) continue

        const record = post.record
        const postDate = new Date(record.createdAt as string)

        if (!oldestPostDate || postDate < oldestPostDate) {
          oldestPostDate = postDate
        }

        if (postDate < BLUESKY_ACCOUNT_CREATED) {
          exhausted = true
          break
        }

        const links: string[] = []

        // Extract links from facets
        const facets = record.facets as Array<{ features: Array<{ uri?: string, $type?: string }> }> | undefined
        if (facets) {
          for (const facet of facets) {
            for (const feature of facet.features) {
              if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
                links.push(feature.uri)
              }
            }
          }
        }

        if (post.embed && 'external' in post.embed) {
          const external = post.embed.external as { uri?: string }
          if (external.uri) {
            links.push(external.uri)
          }
        }

        if (links.length > 0) {
          posts.push({
            uri: post.uri,
            createdAt: record.createdAt as string,
            links,
          })
        }
      }

      cursor = data.cursor

      if (!cursor) {
        exhausted = true
      }

      return true
    }
    catch {
      exhausted = true
      return false
    }
  }

  return {
    posts,
    fetchMore: fetchNextPage,
    getOldestPostDate: () => oldestPostDate,
    /** Check if we've exhausted all pages */
    isExhausted: () => exhausted,
  }
}
