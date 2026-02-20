import { createClient } from '@sanity/client'
import { $fetch } from 'ofetch'

import type { SyncItem, SyncOptions, SyncProvider } from './index'

// Advocu allowed tags enum (from API docs)
const ADVOCU_TAGS = [
  'AI', 'AI - AI Studio', 'AI - Agent Development Kit (ADK)', 'AI - Agents', 'AI - Colab', 'AI - Gemini', 'AI - Gemma', 'AI - Generative AI', 'AI - JAX', 'AI - Kaggle', 'AI - Keras', 'AI - LLM', 'AI - LiteRT', 'AI - ML Engineering (MLOps)', 'AI - MediaPipe', 'AI - On-Device AI', 'AI - Responsible AI', 'AI - TPU', 'AI - TensorFlow', 'AI - Vertex AI', 'AI Math Clubs', 'AI Paper Reading Clubs', 'AR/VR', 'Android', 'Android - ARCore', 'Android - Android Auto', 'Android - Android Dev Tools', 'Android - Android Studio', 'Android - Android TV', 'Android - App Architecture & Arch Components', 'Android - App Indexing', 'Android - App Performance', 'Android - App Quality', 'Android - Camera', 'Android - Composer', 'Android - Form Factors', 'Android - Gemini Nano', 'Android - Jetpack', 'Android - Jetpack Compose', 'Android - Kotlin', 'Android - Material Design', 'Android - Media', 'Android - Modern Android Development', 'Android - Modern UI', 'Android - NDK', 'Android - Passkeys', 'Android - Performance', 'Android - Vulkan', 'Android - Wear OS', 'Android - Widgets', 'Android - XR', 'Angular', 'Build with AI', 'Cloud - AI Tools', 'Cloud - API Gateways', 'Cloud - App Development', 'Cloud - Compute, Networking, Storage', 'Cloud - Data', 'Cloud - Operations & Management', 'Cloud - Security', 'Cloud - Serverless & Containers', 'Cloud Study Jam', 'Dart', 'DevFest', 'Diversity & Inclusion', 'Earth Engine', 'Firebase', 'Firebase - A/B Testing', 'Firebase - AI Monitoring', 'Firebase - Analytics', 'Firebase - App Hosting', 'Firebase - Authentication', 'Firebase - Cloud Messaging', 'Firebase - Data Connect', 'Firebase - Firebase Studio', 'Firebase - Firestore', 'Firebase - Genkit', 'Firebase - Performance', 'Firebase - Realtime Database', 'Firebase - Remote Config', 'Firebase - Test Lab', 'Firebase - Vertex AI in Firebase', 'Flutter', 'Golang', 'Google Cloud', 'Google I/O Extended', 'Google Maps Platform', 'Google Workspace', 'Identity', 'Identity - Google OAuth', 'Identity - Sign in with Google', 'International Women\'s Day', 'ML Study Jams', 'Open Source', 'Payments', 'Payments - Google Pay', 'Payments - Google Wallet', 'Road to Google Developers Certification', 'UX / UI Design', 'Web', 'Web - AI for Web Developers', 'Web - Browser Extensions', 'Web - CSS & UI', 'Web - DevTools & Browser Automation', 'Web - Fugu/PWA APIs', 'Web - Identity', 'Web - Performance', 'Workspace - Add Ons', 'Workspace - AppSheet', 'Workspace - Google Apps Script', 'Workspace - Google Workspace (REST) APIs',
]

const ELIGIBLE_TYPES = new Set(['blog', 'article', 'talk'])

export class GdeAdvocuProvider implements SyncProvider {
  name = 'gde-advocu'

  async sync (items: SyncItem[], { dryRun }: SyncOptions): Promise<void> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const eligible = items.filter(i =>
      ELIGIBLE_TYPES.has(i.type)
      && (!i.date || new Date(i.date) >= sixMonthsAgo),
    )
    if (!eligible.length) return

    if (dryRun) {
      console.info(`[sync:gde-advocu] Would sync up to ${eligible.length} items (last 6 months, pending dedupe check)`)
      for (const item of eligible) {
        const safeTags = validateTags(item.tags)
        const tagNote = item.tags?.length && !safeTags.length ? ' (no valid tags — would skip)' : ''
        console.info(`[sync:gde-advocu]   ${item.type}: ${item.title}${tagNote}`)
      }
      return
    }

    const token = process.env.NUXT_ADVOCU_TOKEN
    if (!token) throw new Error('No NUXT_ADVOCU_TOKEN provided.')

    const sanityToken = process.env.NUXT_SANITY_TOKEN
    if (!sanityToken) throw new Error('No NUXT_SANITY_TOKEN provided for Advocu dedupe tracking.')

    const sanityClient = createClient({
      projectId: '9bj3w2vo',
      dataset: 'production',
      apiVersion: '2025-01-01',
      useCdn: false,
      token: sanityToken,
    })

    const $advocu = $fetch.create({
      baseURL: 'https://api.advocu.com/personal-api/v1/gde',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    let synced = 0
    for (const item of eligible) {
      const sanityId = `advocu-sync-${item.type}-${base64url(item.canonical_url)}`
      const existing = await sanityClient.fetch('*[_id == $id][0]', { id: sanityId })
      if (existing) continue

      const safeTags = validateTags(item.tags)
      if (item.tags && safeTags.length === 0) {
        console.warn(`[sync:gde-advocu] No valid tags for: ${item.title}. Provided: ${JSON.stringify(item.tags)}`)
        continue
      }

      const sharedBody = {
        title: item.title.slice(0, 200),
        description: item.description?.slice(0, 2000) || '',
        tags: safeTags,
        activityDate: item.date?.slice(0, 10),
        activityUrl: item.canonical_url.slice(0, 500),
        additionalInfo: '',
        private: false,
      }

      try {
        if (item.type === 'blog' || item.type === 'article') {
          await $advocu('/activity-drafts/content-creation', {
            method: 'POST',
            body: { contentType: 'Articles', ...sharedBody },
          })
        }
        else if (item.type === 'talk') {
          await $advocu('/activity-drafts/public-speaking', {
            method: 'POST',
            body: sharedBody,
          })
        }
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : error
        console.error(`[sync:gde-advocu] Failed for ${item.canonical_url}:`, message)
        continue
      }

      synced++
      await sanityClient.createOrReplace({
        _id: sanityId,
        _type: 'advocuSync',
        canonical_url: item.canonical_url,
        syncedAt: new Date().toISOString(),
      })
    }

    console.info(`[sync:gde-advocu] Done: ${synced} synced`)
  }
}

function base64url (str: string): string {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function validateTags (tags: string[] = []): string[] {
  return tags
    .map(t => ADVOCU_TAGS.find(e => t.toLowerCase() === e.toLowerCase()))
    .filter((t): t is string => !!t)
    .slice(0, 4)
}
