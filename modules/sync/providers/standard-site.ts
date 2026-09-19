import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { Client } from '@atproto/lex'
import type { LexMap } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'
import { useRuntimeConfig } from 'nuxt/kit'

import type { SyncItem, SyncOptions, SyncProvider } from './index'
import { publicationRkey, tidFromDate } from '../../shared/tid'

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

    const cfg = useRuntimeConfig()
    const pdsUrl = cfg.public.atproto.service
    const { handle, password } = cfg.atproto
    if (!pdsUrl || !handle || !password) {
      const missing = !password ? 'NUXT_ATPROTO_PASSWORD' : 'social.networks.bluesky.identifier'
      throw new Error(`atproto identity / credentials not configured (missing ${missing}).`)
    }

    const session = await PasswordSession.login({ service: pdsUrl, identifier: handle, password })
    const client = new Client(session)

    const did = client.assertDid

    const publication: LexMap = {
      $type: 'site.standard.publication',
      url: 'https://roe.dev',
      name: 'Daniel Roe',
      description: 'The personal website of Daniel Roe',
      preferences: { showInDiscover: true },
      basicTheme,
    }

    const icon = await resolvePublicationIcon(client)
    if (icon) publication.icon = icon

    try {
      await client.putRecord(publication as LexMap & { $type: 'site.standard.publication' }, publicationRkey)
    }
    catch (error) {
      console.warn('[sync:standard-site] Failed to update publication record:', error instanceof Error ? error.message : error)
    }

    // Delete legacy 'self' rkey publication record if it exists
    try {
      await client.deleteRecord('site.standard.publication', 'self')
      console.info('[sync:standard-site] Deleted legacy publication record with rkey: self')
    }
    catch {
      // Record may not exist, that's fine
    }

    // Build set of expected rkeys from current blog posts
    const expectedRkeys = new Set(
      blogItems
        .filter(i => i.date)
        .map(i => tidFromDate(i.date!)),
    )

    // Delete any existing records that don't match a current blog post's TID
    const previous = new Map<string, LexMap>()
    try {
      const existing = await client.listRecords('site.standard.document', { repo: did, limit: 100 })
      for (const record of existing.body.records) {
        const rkey = record.uri.split('/').pop()!
        if (!expectedRkeys.has(rkey)) {
          console.info(`[sync:standard-site] Deleting stale record with rkey: ${rkey}`)
          await client.deleteRecord('site.standard.document', rkey)
          continue
        }
        previous.set(rkey, record.value as LexMap)
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

      const record: LexMap = {
        $type: 'site.standard.document',
        site: `at://${did}/site.standard.publication/${publicationRkey}`,
        path: `/blog/${slug}`,
        title: item.title,
        publishedAt: new Date(item.date).toISOString(),
        updatedAt: new Date(now + updated * 1000).toISOString(),
      }

      if (item.description) record.description = item.description
      if (item.tags?.length) record.tags = item.tags
      if (item.text_content) record.textContent = item.text_content

      const existing = previous.get(rkey)

      const bskyPostRef = await resolveBskyPostRef(client, did, item.bluesky, existing)
      if (bskyPostRef) record.bskyPostRef = bskyPostRef

      const coverImage = await resolveCoverImage(client, item.canonical_url, existing)
      if (coverImage) record.coverImage = coverImage

      await client.putRecord(record as LexMap & { $type: 'site.standard.document' }, rkey)

      updated++
    }

    console.info(`[sync:standard-site] Done: ${updated} updated`)
  }
}

const rgb = (r: number, g: number, b: number) => ({ $type: 'site.standard.theme.color#rgb', r, g, b })

/** Light-mode palette from `app/assets/main.css`. */
const basicTheme = {
  $type: 'site.standard.theme.basic',
  background: rgb(229, 231, 235),
  foreground: rgb(31, 41, 55),
  accent: rgb(31, 41, 55),
  accentForeground: rgb(243, 244, 246),
}

const iconPath = fileURLToPath(new URL('../../../public/android-chrome-512x512.png', import.meta.url))

/**
 * Reuses the blob already referenced by the publication record where possible,
 * as re-uploading produces a new CID and invalidates consumers' cached icons.
 */
async function resolvePublicationIcon (client: Client) {
  try {
    const existing = await client.getRecord('site.standard.publication', publicationRkey)
    const icon = (existing.body.value as LexMap).icon
    if (icon) return icon
  }
  catch {
    // no publication record yet
  }

  try {
    const data = await readFile(iconPath)
    const upload = await client.uploadBlob(new Uint8Array(data), { encoding: 'image/png' })
    return upload.body.blob
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
async function resolveBskyPostRef (client: Client, did: string, uri: string | undefined, existing: LexMap | undefined) {
  if (!uri) return

  const stored = existing?.bskyPostRef as { uri?: string } | undefined
  if (stored?.uri === uri) return stored

  const [, , repo, collection, rkey] = uri.split('/')
  if (repo !== did || collection !== 'app.bsky.feed.post' || !rkey) return

  try {
    const post = await client.getRecord(collection, rkey)
    if (!post.body.cid) return
    return { uri: post.body.uri, cid: post.body.cid }
  }
  catch (error) {
    console.warn(`[sync:standard-site] Failed to resolve Bluesky post ${uri}:`, error instanceof Error ? error.message : error)
  }
}

/**
 * Uses the page's own Open Graph image as the cover. It is read from the
 * deployed site rather than generated here, as og images are rendered during
 * prerender and do not exist on disk while this runs; a post published in this
 * deploy therefore picks its cover up on the next one.
 */
async function resolveCoverImage (client: Client, canonicalURL: string, existing: LexMap | undefined) {
  const stored = existing?.coverImage
  if (stored) return stored

  try {
    const html = await fetch(canonicalURL).then(r => r.ok ? r.text() : null)
    const url = html?.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
    if (!url) return

    const response = await fetch(url)
    if (!response.ok) return

    const type = response.headers.get('content-type')
    const encoding = type?.startsWith('image/') ? type as `image/${string}` : 'image/png'
    const data = new Uint8Array(await response.arrayBuffer())
    if (data.byteLength > MAX_COVER_BYTES) return

    const upload = await client.uploadBlob(data, { encoding })
    return upload.body.blob
  }
  catch (error) {
    console.warn(`[sync:standard-site] Failed to upload cover image for ${canonicalURL}:`, error instanceof Error ? error.message : error)
  }
}
