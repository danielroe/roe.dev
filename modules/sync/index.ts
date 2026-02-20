import process from 'node:process'
import { createClient } from '@sanity/client'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'

import { syncAll } from './providers'
import type { SyncItem } from './providers'

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
  const sanityToken = process.env.NUXT_SANITY_TOKEN
  if (!sanityToken) {
    console.warn('[sync] No NUXT_SANITY_TOKEN — skipping talks')
    return []
  }

  const client = createClient({
    projectId: '9bj3w2vo',
    dataset: 'production',
    apiVersion: '2025-01-01',
    useCdn: false,
    token: sanityToken,
  })

  try {
    const talks = await client.fetch<Array<{
      title: string
      description?: string
      date: string
      type: string
      tags?: string[]
      link?: string
      video?: string
    }>>(`*[_type == "talk" && date < now() && defined(title) && title != ""] {
      title, description, date, type, tags, link, video
    } | order(date desc)`)

    return talks
      .filter(t => t.link || t.video)
      .map(t => ({
        type: TALK_TYPE_MAP[t.type] || 'talk' as SyncItem['type'],
        title: t.title,
        date: t.date,
        body_markdown: t.description || '',
        canonical_url: (t.link || t.video)!,
        tags: Array.isArray(t.tags) ? t.tags : [],
      }))
  }
  catch (error) {
    console.warn('[sync] Failed to fetch talks:', error instanceof Error ? error.message : error)
    return []
  }
}
