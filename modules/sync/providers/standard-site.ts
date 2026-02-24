import { AtpAgent } from '@atproto/api'

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

    const pdsUrl = process.env.NUXT_STANDARD_SITE_PDS_URL
    const identifier = process.env.NUXT_STANDARD_SITE_IDENTIFIER
    const password = process.env.NUXT_STANDARD_SITE_PASSWORD
    if (!pdsUrl || !identifier || !password) {
      throw new Error('Missing NUXT_STANDARD_SITE_PDS_URL, NUXT_STANDARD_SITE_IDENTIFIER, or NUXT_STANDARD_SITE_PASSWORD')
    }

    const agent = new AtpAgent({ service: pdsUrl })
    await agent.login({ identifier, password })

    const did = agent.session!.did

    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: 'site.standard.publication',
      rkey: publicationRkey,
      record: {
        $type: 'site.standard.publication',
        url: 'https://roe.dev',
        name: 'Daniel Roe',
        description: 'The personal website of Daniel Roe',
        preferences: { showInDiscover: true },
      },
    })

    // Delete legacy 'self' rkey publication record if it exists
    try {
      await agent.com.atproto.repo.deleteRecord({
        repo: did,
        collection: 'site.standard.publication',
        rkey: 'self',
      })
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
      const existing = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: 'site.standard.document',
        limit: 100,
      })
      for (const record of existing.data.records) {
        const rkey = record.uri.split('/').pop()!
        if (!expectedRkeys.has(rkey)) {
          console.info(`[sync:standard-site] Deleting stale record with rkey: ${rkey}`)
          await agent.com.atproto.repo.deleteRecord({
            repo: did,
            collection: 'site.standard.document',
            rkey,
          })
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

      const record: Record<string, unknown> = {
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

      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'site.standard.document',
        rkey,
        record,
      })

      updated++
    }

    console.info(`[sync:standard-site] Done: ${updated} updated`)
  }
}
