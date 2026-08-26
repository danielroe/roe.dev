import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

import { addServerHandler, addServerTemplate, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { joinURL, withoutTrailingSlash } from 'ufo'
import { Client, asStringFormat } from '@atproto/lex'
import { api } from '@bsky/sdk'
import { app, com } from '@bsky/sdk/lexicons'
import { toValue } from 'vue'

import { createBuildCache, hashKey } from './shared/build-cache'

// when I created my Bluesky account - don't judge me for hard coding it!
const BLUESKY_ACCOUNT_CREATED = new Date('2023-04-26T05:22:14.855Z')

/**
 * A discovered `at://` URI is written back into the post's frontmatter, so
 * discovery only ever has to run for posts published (or shared) since the
 * last time it ran. Anything older than this window without a `bluesky` key in
 * frontmatter is taken to have no Bluesky thread: walking the author feed back
 * to a post's publication date costs a request per 100 posts, and the answer
 * for old posts is already committed.
 *
 * Set `BSKY_DISCOVERY_WINDOW_DAYS=0` to ignore the window and backfill every
 * post - slow, but it only needs doing once per post.
 */
const DISCOVERY_WINDOW_DAYS = Number(process.env.BSKY_DISCOVERY_WINDOW_DAYS ?? 30)

/**
 * How long after publication a post is still plausibly *the* announcement of an
 * article. Without an upper bound, an article that was never announced matches
 * whichever later post happens to cite it - which is a real post, but its
 * replies are a conversation about something else.
 */
const ANNOUNCEMENT_WINDOW_DAYS = 7

/** How long a fruitless search is trusted before it is worth retrying. */
const NEGATIVE_MAX_AGE = 1000 * 60 * 60

interface ParsedPost {
  uri: string
  createdAt: string
  isReply: boolean
  links: string[] // URLs found in facets and embeds
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
  export const pendingDiscovery: Set<string>
}
`,
    }, { nuxt: true })

    if (nuxt.options._prepare) {
      return
    }

    const resolver = createResolver(import.meta.url)
    const client = new Client(api.app.urlPublic)
    const cache = createBuildCache('bluesky-comments')

    const blueskyHandle = nuxt.options.runtimeConfig.atproto?.handle || null
    if (!blueskyHandle) {
      console.warn('Bluesky handle not configured (no runtimeConfig.atproto.handle). Skipping Bluesky URI discovery.')
      return
    }

    nuxt.hook('markdown:blog-entries', async entries => {
      const siteURL = nuxt.options.site && toValue(nuxt.options.site?.url)
      if (!siteURL) {
        return
      }

      const feed = createFeedIterator(client, blueskyHandle)
      const windowStart = DISCOVERY_WINDOW_DAYS > 0
        ? new Date(Date.now() - DISCOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
        : null
      const pending: Record<string, { url: string, date: string }> = {}

      for (const entry of entries) {
        if (!entry.date) continue

        const url = withoutTrailingSlash(joinURL(siteURL, entry.path))
        const date = new Date(entry.date)

        if (entry.bluesky?.startsWith('at://')) continue

        // an explicit web URL in frontmatter needs no search, just a handle to
        // resolve - and that is usually the site's own, already-resolved handle
        if (entry.bluesky?.startsWith('https://bsky.app/')) {
          const uri = await resolveWebUrl(entry.bluesky, entry.path)
          entry.bluesky = uri ?? undefined
          if (uri) await persist(entry.file, uri)
          continue
        }

        if (date < BLUESKY_ACCOUNT_CREATED) continue
        if (windowStart && date < windowStart) continue

        const key = hashKey(entry.slug, url)
        const miss = await cache.get<null>(key)
        if (miss && Date.now() - miss.mtime < NEGATIVE_MAX_AGE) {
          pending[entry.path] = { url, date: date.toISOString() }
          continue
        }

        const uri = await discoverInFeed(url, date)
        if (uri) {
          console.log(`Auto-discovered Bluesky post for ${entry.path}`)
          entry.bluesky = uri
          await persist(entry.file, uri)
        }
        else {
          await cache.set(key, null)
          pending[entry.path] = { url, date: date.toISOString() }
        }
      }

      addTemplate({
        filename: 'bsky-runtime-discovery.mjs',
        // the boolean lets the client-side discovery in `blog/[article].vue`
        // be tree-shaken away entirely when nothing is pending
        getContents: () => [
          `export const needsRuntimeDiscovery = ${Object.keys(pending).length > 0}`,
          `export const pendingDiscovery = new Set(${JSON.stringify(Object.keys(pending))})`,
        ].join('\n'),
        write: true,
      })

      addServerTemplate({
        filename: 'bsky-runtime-discovery-server.mjs',
        getContents: () => `export const pendingPosts = ${JSON.stringify(pending)}`,
      })

      if (Object.keys(pending).length > 0) {
        addServerHandler({
          route: '/api/discover-bluesky-post',
          handler: resolver.resolve('./runtime/server/discover-bluesky-post.get'),
        })
      }

      async function resolveWebUrl (webUrl: string, path: string): Promise<string | null> {
        const match = webUrl.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/)
        if (!match) return null
        const [, actor, rkey] = match
        try {
          const did = actor!.startsWith('did:')
            ? actor!
            : actor === blueskyHandle && nuxt.options.runtimeConfig.atproto?.did
              ? nuxt.options.runtimeConfig.atproto.did
              : (await client.call(com.atproto.identity.resolveHandle, { handle: asStringFormat(actor!, 'handle') })).did
          return `at://${did}/app.bsky.feed.post/${rkey}`
        }
        catch (error) {
          console.warn(`Failed to resolve Bluesky handle for ${path}:`, error)
          return null
        }
      }

      async function discoverInFeed (url: string, date: Date): Promise<string | null> {
        const searchStart = new Date(date.getTime() - 24 * 60 * 60 * 1000)
        const searchEnd = new Date(date.getTime() + ANNOUNCEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000)

        while (!feed.isExhausted()) {
          const oldestFetchedDate = feed.getOldestPostDate()
          if (oldestFetchedDate && oldestFetchedDate < searchStart) {
            break
          }
          await feed.fetchMore()
        }

        return feed.posts
          .filter(post => {
            // a reply cites an article in someone else's thread; it is never
            // the thread the article's own comments belong in
            if (post.isReply) return false
            const postDate = new Date(post.createdAt)
            if (postDate < searchStart || postDate > searchEnd) return false
            return post.links.some(link => withoutTrailingSlash(link) === url)
          })
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))[0]?.uri ?? null
      }
    })
  },
})

/** Record `uri` as the `bluesky` frontmatter key of the post at `file`. */
async function persist (file: string, uri: string) {
  try {
    const source = await readFile(file, 'utf8')
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!frontmatter) return

    const line = `bluesky: '${uri}'`
    const updated = /^bluesky:.*$/m.test(frontmatter[1]!)
      ? frontmatter[1]!.replace(/^bluesky:.*$/m, line)
      : `${frontmatter[1]}\n${line}`

    await writeFile(file, source.replace(frontmatter[0], `---\n${updated}\n---`))
  }
  catch (error) {
    console.warn(`Failed to record Bluesky URI in ${file}:`, error)
  }
}

function createFeedIterator (client: Client, actor: string) {
  const posts: ParsedPost[] = []
  let cursor: string | undefined
  let exhausted = false
  let oldestPostDate: Date | null = null

  async function fetchNextPage (): Promise<boolean> {
    if (exhausted) return false

    try {
      const data = await client.call(app.bsky.feed.getAuthorFeed, {
        actor: asStringFormat(actor, 'at-identifier'),
        limit: 100,
        cursor,
      })

      for (const item of data.feed) {
        // skip reposts
        if (item.reason) continue

        const post = item.post
        if (!app.bsky.feed.post.$matches(post.record)) continue

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
            isReply: !!record.reply,
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
