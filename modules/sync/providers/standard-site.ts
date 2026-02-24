import { AtpAgent } from '@atproto/api'

import type { SyncItem, SyncOptions, SyncProvider } from './index'
import { tidFromDate } from '../../shared/tid'

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
      rkey: 'self',
      record: {
        $type: 'site.standard.publication',
        url: 'https://roe.dev',
        name: 'Daniel Roe',
        description: 'The personal website of Daniel Roe',
        preferences: { showInDiscover: true },
      },
    })

    // Delete any existing records with non-TID rkeys (slug-based)
    const tidPattern = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/
    try {
      const existing = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: 'site.standard.document',
        limit: 100,
      })
      for (const record of existing.data.records) {
        const rkey = record.uri.split('/').pop()!
        if (!tidPattern.test(rkey)) {
          console.info(`[sync:standard-site] Deleting legacy record with rkey: ${rkey}`)
          await agent.com.atproto.repo.deleteRecord({
            repo: did,
            collection: 'site.standard.document',
            rkey,
          })
        }
      }
    }
    catch (error) {
      console.warn('[sync:standard-site] Failed to clean up legacy records:', error instanceof Error ? error.message : error)
    }

    let updated = 0
    for (const item of blogItems) {
      const slug = item.canonical_url.replace('https://roe.dev/blog/', '').replace(/\/$/, '')
      if (!slug || !item.date) continue

      const rkey = tidFromDate(item.date)

      const record: Record<string, unknown> = {
        $type: 'site.standard.document',
        site: `at://${did}/site.standard.publication/self`,
        path: `/blog/${slug}`,
        title: item.title,
        publishedAt: new Date(item.date).toISOString(),
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
