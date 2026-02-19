import { AtpAgent } from '@atproto/api'

import type { SyncItem, SyncProvider } from './index'

export class StandardSiteProvider implements SyncProvider {
  name = 'standard-site'

  async sync (items: SyncItem[]): Promise<{ status: string, count: number, total: number }> {
    const config = useRuntimeConfig()
    const pdsUrl = config.standardSite?.pdsUrl
    const identifier = config.standardSite?.identifier
    const password = config.standardSite?.password
    if (!pdsUrl || !identifier || !password) {
      throw new Error('Missing NUXT_STANDARD_SITE_PDS_URL, NUXT_STANDARD_SITE_IDENTIFIER, or NUXT_STANDARD_SITE_PASSWORD')
    }

    const agent = new AtpAgent({ service: pdsUrl })
    await agent.login({ identifier, password })

    const did = agent.session!.did

    // Upsert the publication record
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: 'site.standard.publication',
      rkey: 'self',
      record: {
        $type: 'site.standard.publication',
        url: 'https://roe.dev',
        name: 'Daniel Roe',
        description: 'The personal website of Daniel Roe',
        preferences: {
          showInDiscover: true,
        },
      },
    })

    let updated = 0
    for (const item of items) {
      if (item.type !== 'blog') {
        continue
      }

      // Extract slug from canonical_url: https://roe.dev/blog/<slug>/
      const slug = item.canonical_url.replace('https://roe.dev/blog/', '').replace(/\/$/, '')
      if (!slug) continue

      const record: Record<string, unknown> = {
        $type: 'site.standard.document',
        site: `at://${did}/site.standard.publication/self`,
        path: `/blog/${slug}`,
        title: item.title,
        publishedAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      }

      if (item.description) {
        record.description = item.description
      }

      if (item.tags?.length) {
        record.tags = item.tags
      }

      if (item.body_markdown) {
        record.textContent = mdStripFormatting(item.body_markdown)
      }

      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'site.standard.document',
        rkey: slug,
        record,
      })

      updated++
    }

    return { status: 'done', count: updated, total: items.length }
  }
}
