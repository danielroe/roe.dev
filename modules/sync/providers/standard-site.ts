import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import type { RecordOf } from 'airspace'
import type { l } from '@atproto/lex-schema'
import type { site } from '../../../shared/lex/index.ts'

import type { SyncItem, SyncOptions, SyncProvider } from './index'
import { useBuildAirspaceWithSession } from '../../shared/airspace'
import { standardSiteCollections } from '../../../shared/standard-site'
import { publicationRkey, tidFromDate } from '../../shared/tid'

type Airspace = Awaited<ReturnType<typeof useBuildAirspaceWithSession<typeof standardSiteCollections>>>
type Document = RecordOf<typeof standardSiteCollections.documents>['value']

export class StandardSiteProvider implements SyncProvider {
  name = 'standard-site'

  async sync (items: SyncItem[], { dryRun }: SyncOptions): Promise<void> {
    const blogItems = items.filter(i => i.type === 'blog')
    if (!blogItems.length) return

    if (dryRun) {
      console.info(`[sync:standard-site] Would sync ${blogItems.length} blog posts as AT Protocol documents`)
      for (const item of blogItems) {
        const slug = item.canonical_url.replace('https://roe.dev/blog/', '').replace(/\/$/, '')
        const rkey = item.date ? tidFromDate(item.date) : '(no date)'
        console.info(`[sync:standard-site]   /blog/${slug} (rkey: ${rkey}): ${item.title}`)
      }
      return
    }

    const airspace = await useBuildAirspaceWithSession(standardSiteCollections)
    const { did } = await airspace.identity()

    try {
      await airspace.publication.put(publicationRkey, {
        url: 'https://roe.dev',
        name: 'Daniel Roe',
        description: 'The personal website of Daniel Roe',
        preferences: { showInDiscover: true },
        basicTheme,
        icon: await resolvePublicationIcon(airspace),
      })
    }
    catch (error) {
      console.warn('[sync:standard-site] Failed to update publication record:', error instanceof Error ? error.message : error)
    }

    // Build set of expected rkeys from current blog posts
    const expectedRkeys = new Set(
      blogItems
        .filter(i => i.date)
        .map(i => tidFromDate(i.date!)),
    )

    // Delete any existing records that don't match a current blog post's TID
    const previous = new Map<string, Document>()
    try {
      for (const record of await airspace.documents.list()) {
        if (!expectedRkeys.has(record.rkey)) {
          console.info(`[sync:standard-site] Deleting stale record with rkey: ${record.rkey}`)
          await airspace.documents.delete(record.rkey)
          continue
        }
        previous.set(record.rkey, record.value)
      }
    }
    catch (error) {
      console.warn('[sync:standard-site] Failed to clean up stale records:', error instanceof Error ? error.message : error)
    }

    let updated = 0
    const now = Date.now()
    for (const item of blogItems) {
      const slug = item.canonical_url.replace('https://roe.dev/blog/', '').replace(/\/$/, '')
      if (!slug || !item.date) continue

      const rkey = tidFromDate(item.date)
      const existing = previous.get(rkey)

      await airspace.documents.put(rkey, {
        site: `at://${did}/site.standard.publication/${publicationRkey}`,
        path: `/blog/${slug}`,
        title: item.title,
        publishedAt: new Date(item.date).toISOString() as l.DatetimeString,
        updatedAt: new Date(now + updated * 1000).toISOString() as l.DatetimeString,
        description: item.description || undefined,
        tags: item.tags?.length ? item.tags : undefined,
        textContent: item.text_content,
        bskyPostRef: await resolveBskyPostRef(airspace, did, item.bluesky, existing),
        coverImage: await resolveCoverImage(airspace, item.canonical_url, existing),
      })

      updated++
    }

    console.info(`[sync:standard-site] Done: ${updated} updated`)
  }
}

/** Light-mode palette from `app/assets/main.css`. */
const basicTheme = {
  $type: 'site.standard.theme.basic',
  background: { $type: 'site.standard.theme.color#rgb', r: 229, g: 231, b: 235 },
  foreground: { $type: 'site.standard.theme.color#rgb', r: 31, g: 41, b: 55 },
  accent: { $type: 'site.standard.theme.color#rgb', r: 31, g: 41, b: 55 },
  accentForeground: { $type: 'site.standard.theme.color#rgb', r: 243, g: 244, b: 246 },
} satisfies site.standard.theme.basic.Main

const iconPath = fileURLToPath(new URL('../../../public/android-chrome-512x512.png', import.meta.url))

/**
 * Reuses the blob already referenced by the publication record where possible,
 * as re-uploading produces a new CID and invalidates consumers' cached icons.
 */
async function resolvePublicationIcon (airspace: Airspace) {
  try {
    const existing = await airspace.publication.get(publicationRkey)
    if (existing?.value.icon) return existing.value.icon

    const upload = await airspace.blobs.upload(await readFile(iconPath), { mimeType: 'image/png' })
    return upload.blob
  }
  catch (error) {
    console.warn('[sync:standard-site] Failed to upload publication icon:', error instanceof Error ? error.message : error)
  }
}

/** Max blob size accepted by `site.standard.document#coverImage`. */
const MAX_COVER_BYTES = 1_000_000

/**
 * A strong ref needs the post's CID as well as its URI, so the announcement
 * post is read back from the repo unless the stored ref already points at it.
 */
async function resolveBskyPostRef (airspace: Airspace, did: string, uri: string | undefined, existing: Document | undefined) {
  if (!uri) return

  if (existing?.bskyPostRef?.uri === uri) return existing.bskyPostRef
  if (!uri.startsWith(`at://${did}/app.bsky.feed.post/`)) return

  try {
    const post = await airspace.resolve(uri)
    if (post) return { uri: post.uri, cid: post.cid }
  }
  catch (error) {
    console.warn(`[sync:standard-site] Failed to resolve Bluesky post ${uri}:`, error instanceof Error ? error.message : error)
  }
}

/**
 * Uses the page's own Open Graph image as the cover. Blog pages are rendered
 * on demand rather than prerendered, and the image URL is signed, so the
 * deployed page is the only place the URL can be read from; a post published
 * in this deploy picks its cover up on the next one.
 */
async function resolveCoverImage (airspace: Airspace, canonicalURL: string, existing: Document | undefined) {
  if (existing?.coverImage) return existing.coverImage

  try {
    const html = await fetch(canonicalURL).then(r => r.ok ? r.text() : null)
    const url = html?.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
    if (!url) return

    const response = await fetch(url)
    const mimeType = response.headers.get('content-type')
    if (!response.ok || !mimeType?.startsWith('image/')) return

    const data = new Uint8Array(await response.arrayBuffer())
    if (data.byteLength > MAX_COVER_BYTES) return

    const upload = await airspace.blobs.upload(data, { mimeType })
    return upload.blob
  }
  catch (error) {
    console.warn(`[sync:standard-site] Failed to upload cover image for ${canonicalURL}:`, error instanceof Error ? error.message : error)
  }
}
