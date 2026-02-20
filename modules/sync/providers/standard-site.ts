import { AtpAgent } from '@atproto/api'

import type { SyncItem, SyncOptions, SyncProvider } from './index'

export class StandardSiteProvider implements SyncProvider {
  name = 'standard-site'

  async sync (items: SyncItem[], { dryRun }: SyncOptions): Promise<void> {
    const blogItems = items.filter(i => i.type === 'blog')
    if (!blogItems.length) return

    if (dryRun) {
      console.info(`[sync:standard-site] Would sync ${blogItems.length} blog posts as AT Protocol documents`)
      for (const item of blogItems) {
        const slug = item.canonical_url.replace('https://roe.dev/blog/', '').replace(/\/$/, '')
        console.info(`[sync:standard-site]   /blog/${slug}: ${item.title}`)
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

    let updated = 0
    for (const item of blogItems) {
      const slug = item.canonical_url.replace('https://roe.dev/blog/', '').replace(/\/$/, '')
      if (!slug) continue

      const record: Record<string, unknown> = {
        $type: 'site.standard.document',
        site: `at://${did}/site.standard.publication/self`,
        path: `/blog/${slug}`,
        title: item.title,
        publishedAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      }

      if (item.description) record.description = item.description
      if (item.tags?.length) record.tags = item.tags
      if (item.text_content) record.textContent = item.text_content

      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'site.standard.document',
        rkey: slug,
        record,
      })

      updated++
    }

    console.info(`[sync:standard-site] Done: ${updated} updated`)
  }
}
