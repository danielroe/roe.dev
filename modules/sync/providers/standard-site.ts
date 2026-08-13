import { Client } from '@atproto/lex'
import type { LexMap } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'
import { useNuxt } from 'nuxt/kit'

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

    // Build-time module code: pull credentials from the resolved runtime
    // config rather than `process.env` directly so there's one source of
    // truth shared with the runtime `server/utils/atproto.ts`.
    const cfg = useNuxt().options.runtimeConfig
    const pdsUrl = cfg.public.atproto.service
    const { handle, password } = cfg.atproto
    if (!pdsUrl || !handle || !password) {
      throw new Error('atproto identity / credentials not configured (PDS resolved at build time; check NUXT_ATPROTO_PASSWORD and social.networks.bluesky.identifier).')
    }

    const session = await PasswordSession.login({ service: pdsUrl, identifier: handle, password })
    const client = new Client(session)

    const did = client.assertDid

    await client.putRecord({
      $type: 'site.standard.publication',
      url: 'https://roe.dev',
      name: 'Daniel Roe',
      description: 'The personal website of Daniel Roe',
      preferences: { showInDiscover: true },
    }, publicationRkey)

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
    try {
      const existing = await client.listRecords('site.standard.document', { repo: did, limit: 100 })
      for (const record of existing.body.records) {
        const rkey = record.uri.split('/').pop()!
        if (!expectedRkeys.has(rkey)) {
          console.info(`[sync:standard-site] Deleting stale record with rkey: ${rkey}`)
          await client.deleteRecord('site.standard.document', rkey)
        }
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

      await client.putRecord(record as LexMap & { $type: 'site.standard.document' }, rkey)

      updated++
    }

    console.info(`[sync:standard-site] Done: ${updated} updated`)
  }
}
