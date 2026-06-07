import process from 'node:process'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'

import { syncAll } from './providers'
import type { SyncItem } from './providers'
import { listAllRecords } from '../shared/atproto-read'
import type { DevRoeTalk } from '../../shared/lex'

const TALK_TYPE_MAP: Record<string, SyncItem['type']> = {
  podcast: 'video',
  talk: 'talk',
  meetup: 'talk',
  conference: 'talk',
  stream: 'video',
  workshop: 'talk',
}

export default defineNuxtModule({
  meta: {
    name: 'sync',
  },
  setup () {
    const nuxt = useNuxt()
    if (nuxt.options.test || nuxt.options._prepare) return

    const dryRun = process.argv.includes('--dry-run')
    const isProductionDeploy = process.env.VERCEL_ENV === 'production'

    if (!dryRun && !isProductionDeploy) {
      console.info(`[sync] Skipped (VERCEL_ENV=${process.env.VERCEL_ENV || 'unset'})`)
      return
    }

    nuxt.hook('markdown:sync-articles', async articles => {
      const talks = await fetchTalks()
      const items: SyncItem[] = [...articles, ...talks]

      console.info(`[sync] ${dryRun ? 'Dry run' : 'Syncing'}: ${items.length} items (${articles.length} articles, ${talks.length} talks)`)
      await syncAll(items, { dryRun })
      console.info('[sync] Complete')
    })
  },
})

async function fetchTalks (): Promise<SyncItem[]> {
  try {
    const records = await listAllRecords<DevRoeTalk.Record>('dev.roe.talk')
    const now = new Date().toISOString()
    return records
      .map(r => r.value)
      .filter(t => t.date < now && t.title && t.title.trim() !== '')
      .filter(t => t.link || t.video)
      .map(t => ({
        type: TALK_TYPE_MAP[t.type] || 'talk' as SyncItem['type'],
        title: t.title!,
        date: t.date,
        body_markdown: t.description || '',
        canonical_url: (t.link || t.video)!,
        tags: Array.isArray(t.tags) ? t.tags : [],
      }))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }
  catch (error) {
    console.warn('[sync] Failed to fetch talks from atproto:', error instanceof Error ? error.message : error)
    return []
  }
}
