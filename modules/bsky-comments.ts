import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { addServerHandler, addServerTemplate, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'
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

interface BlogPost {
  slug: string
  path: string
  url: string
  date: Date
  blueskyUri: string | null
}

export default defineNuxtModule({
  meta: {
    name: 'bsky-comments',
  },
  async setup () {
    const nuxt = useNuxt()

    addTypeTemplate({
      filename: 'types/bsky-runtime-discovery.d.ts',
      getContents: () => `
declare module '#build/bsky-runtime-discovery.mjs' {
  export const needsRuntimeDiscovery: boolean
  export const newestPostPath: string | null
}
`,
    }, { nuxt: true })

    if (nuxt.options._prepare) {
      return
    }

    const resolver = createResolver(import.meta.url)
    const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })

    const cacheDir = join(nuxt.options.rootDir, 'node_modules', '.cache', 'bluesky-comments')
    if (!existsSync(cacheDir)) {
      await mkdir(cacheDir, { recursive: true })
    }
    const blueskyHandle = nuxt.options.social.networks.bluesky!.identifier

    // Receive blog data from the markdown module hook and discover Bluesky URIs
    const blogPosts: BlogPost[] = []

    nuxt.hook('markdown:blog-entries', async entries => {
      const feedIterator = createFeedIterator(agent, blueskyHandle)

      for (const entry of entries) {
        if (!entry.date) continue

        const blogPath = entry.path
        const blogUrl = withoutTrailingSlash(joinURL(nuxt.options.site.url, blogPath))
        const blogDate = new Date(entry.date)
        const cacheFile = join(cacheDir, `${entry.slug}.json`)

        const blueskyUri = await discoverBlueskyUri()
        blogPosts.push({ slug: entry.slug, path: blogPath, url: blogUrl, date: blogDate, blueskyUri })

        // Inject the discovered URI back into the entry
        if (blueskyUri) {
          entry.bluesky = blueskyUri
        }

        async function discoverBlueskyUri (): Promise<string | null> {
          // Check cache first
          if (existsSync(cacheFile)) {
            try {
              const cacheData = JSON.parse(await readFile(cacheFile, 'utf-8')) as { uri: string | null }
              return cacheData.uri
            }
            catch {
              // Continue to discover
            }
          }

          // 1. explicit bluesky URL in frontmatter
          if (entry.bluesky?.startsWith('https://bsky.app/')) {
            const match = entry.bluesky.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/)
            if (match) {
              const [, handle, rkey] = match
              try {
                const { data: resolved } = await agent.resolveHandle({ handle: handle! })
                const uri = `at://${resolved.did}/app.bsky.feed.post/${rkey}`
                await saveCache(cacheFile, uri)
                return uri
              }
              catch (error) {
                console.warn(`Failed to resolve Bluesky handle for ${blogPath}:`, error)
              }
            }
            await saveCache(cacheFile, null)
            return null
          }

          // 2. blog post date is before Bluesky account creation
          if (blogDate < BLUESKY_ACCOUNT_CREATED) {
            await saveCache(cacheFile, null)
            return null
          }

          // 3. auto-discover posts linking to this blog URL
          const searchCutoff = new Date(blogDate.getTime() - 24 * 60 * 60 * 1000)

          while (!feedIterator.isExhausted()) {
            const oldestFetchedDate = feedIterator.getOldestPostDate()
            if (oldestFetchedDate && oldestFetchedDate < searchCutoff) {
              break
            }
            await feedIterator.fetchMore()
          }

          const matchingPosts = feedIterator.posts
            .filter(post => {
              const postDate = new Date(post.createdAt)
              if (postDate < searchCutoff) return false
              return post.links.some(link => withoutTrailingSlash(link) === blogUrl)
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

          const uri = matchingPosts[0]?.uri ?? null
          if (uri) {
            console.log(`Auto-discovered Bluesky post for ${blogPath}`)
          }
          await saveCache(cacheFile, uri)
          return uri
        }
      }

      // Sort by date descending to find newest
      blogPosts.sort((a, b) => b.date.getTime() - a.date.getTime())
      const newestPost = blogPosts[0]
      const needsRuntimeDiscovery = newestPost && !newestPost.blueskyUri

      // Add virtual file for runtime discovery flag (client-side)
      addTemplate({
        filename: 'bsky-runtime-discovery.mjs',
        getContents: () => `export const needsRuntimeDiscovery = ${!!needsRuntimeDiscovery}
export const newestPostPath = ${newestPost ? JSON.stringify(newestPost.path) : 'null'}`,
        write: true,
      })

      // Add server template with the blog URL and date
      addServerTemplate({
        filename: 'bsky-runtime-discovery-server.mjs',
        getContents: () => `
export const newestPostUrl = ${needsRuntimeDiscovery ? JSON.stringify(newestPost.url) : 'null'}
export const newestPostDate = ${needsRuntimeDiscovery ? JSON.stringify(newestPost.date.toISOString()) : 'null'}`,
      })

      // Conditionally add the server endpoint only when needed
      if (needsRuntimeDiscovery) {
        addServerHandler({
          route: '/api/discover-bluesky-post',
          handler: resolver.resolve('./runtime/server/discover-bluesky-post.get'),
        })
      }
    })
  },
})

async function saveCache (cacheFile: string, uri: string | null) {
  try {
    await writeFile(cacheFile, JSON.stringify({ uri }))
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
