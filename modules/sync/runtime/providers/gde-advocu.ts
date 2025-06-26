import type { SyncItem, SyncProvider } from './index'

// Advocu allowed tags enum (from API docs)
const ADVOCU_TAGS = [
  'AI', 'AI - AI Studio', 'AI - Agent Development Kit (ADK)', 'AI - Agents', 'AI - Colab', 'AI - Gemini', 'AI - Gemma', 'AI - Generative AI', 'AI - JAX', 'AI - Kaggle', 'AI - Keras', 'AI - LLM', 'AI - LiteRT', 'AI - ML Engineering (MLOps)', 'AI - MediaPipe', 'AI - On-Device AI', 'AI - Responsible AI', 'AI - TPU', 'AI - TensorFlow', 'AI - Vertex AI', 'AI Math Clubs', 'AI Paper Reading Clubs', 'AR/VR', 'Android', 'Android - ARCore', 'Android - Android Auto', 'Android - Android Dev Tools', 'Android - Android Studio', 'Android - Android TV', 'Android - App Architecture & Arch Components', 'Android - App Indexing', 'Android - App Performance', 'Android - App Quality', 'Android - Camera', 'Android - Composer', 'Android - Form Factors', 'Android - Gemini Nano', 'Android - Jetpack', 'Android - Jetpack Compose', 'Android - Kotlin', 'Android - Material Design', 'Android - Media', 'Android - Modern Android Development', 'Android - Modern UI', 'Android - NDK', 'Android - Passkeys', 'Android - Performance', 'Android - Vulkan', 'Android - Wear OS', 'Android - Widgets', 'Android - XR', 'Angular', 'Build with AI', 'Cloud - AI Tools', 'Cloud - API Gateways', 'Cloud - App Development', 'Cloud - Compute, Networking, Storage', 'Cloud - Data', 'Cloud - Operations & Management', 'Cloud - Security', 'Cloud - Serverless & Containers', 'Cloud Study Jam', 'Dart', 'DevFest', 'Diversity & Inclusion', 'Earth Engine', 'Firebase', 'Firebase - A/B Testing', 'Firebase - AI Monitoring', 'Firebase - Analytics', 'Firebase - App Hosting', 'Firebase - Authentication', 'Firebase - Cloud Messaging', 'Firebase - Data Connect', 'Firebase - Firebase Studio', 'Firebase - Firestore', 'Firebase - Genkit', 'Firebase - Performance', 'Firebase - Realtime Database', 'Firebase - Remote Config', 'Firebase - Test Lab', 'Firebase - Vertex AI in Firebase', 'Flutter', 'Golang', 'Google Cloud', 'Google I/O Extended', 'Google Maps Platform', 'Google Workspace', 'Identity', 'Identity - Google OAuth', 'Identity - Sign in with Google', 'International Women\'s Day', 'ML Study Jams', 'Open Source', 'Payments', 'Payments - Google Pay', 'Payments - Google Wallet', 'Road to Google Developers Certification', 'UX / UI Design', 'Web', 'Web - AI for Web Developers', 'Web - Browser Extensions', 'Web - CSS & UI', 'Web - DevTools & Browser Automation', 'Web - Fugu/PWA APIs', 'Web - Identity', 'Web - Performance', 'Workspace - Add Ons', 'Workspace - AppSheet', 'Workspace - Google Apps Script', 'Workspace - Google Workspace (REST) APIs',
]

export class GdeAdvocuProvider implements SyncProvider {
  name = 'gde-advocu'

  async sync (items: SyncItem[]): Promise<{ status: string, count: number, total: number }> {
    const token = useRuntimeConfig().advocuToken || useRuntimeConfig().advocu_token || useRuntimeConfig().ADVOCU_TOKEN
    if (!token) throw new Error('No NUXT_ADVOCU_TOKEN provided.')

    const { client: sanityClient } = useSanity()

    const $advocu = $fetch.create({
      baseURL: 'https://api.advocu.com/personal-api/v1/gde',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    let synced = 0

    for (const item of items) {
      if (item.type !== 'blog' && item.type !== 'article' && item.type !== 'talk') {
        continue
      }

      if (item.date) {
        const itemDate = new Date(item.date)
        if (itemDate < sixMonthsAgo) {
          continue
        }
      }

      // Check if already synced in Sanity
      const sanityId = `advocu-sync-${item.type}-${base64url(item.canonical_url)}`
      const existing = await sanityClient.fetch('*[_id == $id][0]', { id: sanityId })
      if (existing) continue

      const safeTags = validateTags(item.tags)
      if (item.tags && safeTags.length === 0) {
        console.warn(`No valid Advocu tags for item: ${item.title} (${item.canonical_url}). Provided: ${JSON.stringify(item.tags)}`)
      }

      try {
        if (item.type === 'blog' || item.type === 'article') {
          await $advocu('/activity-drafts/content-creation', {
            method: 'POST',
            body: {
              contentType: 'Articles',
              title: item.title.slice(0, 200),
              description: item.description?.slice(0, 2000) || '',
              tags: safeTags,
              activityDate: item.date?.slice(0, 10),
              activityUrl: item.canonical_url.slice(0, 500),
              additionalInfo: '',
              private: false,
            },
          })
        }
        else if (item.type === 'talk') {
          await $advocu('/activity-drafts/public-speaking', {
            method: 'POST',
            body: {
              title: item.title.slice(0, 200),
              description: item.description?.slice(0, 2000) || '',
              tags: safeTags,
              activityDate: item.date?.slice(0, 10),
              activityUrl: item.canonical_url.slice(0, 500),
              additionalInfo: '',
              private: false,
            },
          })
        }
      }
      catch (error: any) {
        // Log payload and error for debugging
        console.error('Advocu sync error:', {
          type: item.type,
          url: item.canonical_url,
          payload: {
            title: item.title.slice(0, 200),
            description: item.description?.slice(0, 2000) || '',
            tags: safeTags,
            activityDate: item.date?.slice(0, 10),
            activityUrl: item.canonical_url.slice(0, 500),
          },
          error: error?.response || error?.data || error?.message || error,
        })
        continue
      }

      synced++
      await sanityClient.createOrReplace({
        _id: sanityId,
        _type: 'advocuSync',
        canonical_url: item.canonical_url,
        syncedAt: new Date().toISOString(),
      })
      // Extend for other types as needed
    }
    return { status: 'done', count: synced, total: items.length }
  }
}

function base64url (str: string) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function validateTags (tags: string[] = []): string[] {
  // Only allow tags that match the enum exactly (case-insensitive match)
  return (tags || [])
    .map(t => ADVOCU_TAGS.find(e => t.toLowerCase() === e.toLowerCase()))
    .filter(Boolean)
    .slice(0, 4) as string[]
}
