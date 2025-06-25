import { GithubStarsProvider } from './github-stars'
import { DevToProvider } from './dev-to'

const providers: Record<string, SyncProvider> = {
  'github-stars': new GithubStarsProvider(),
  'dev-to': new DevToProvider(),
}

function getProvider (name: string): SyncProvider {
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown sync provider: ${name}`)
  return provider
}

export async function syncWithProvider (providerName: string, items: SyncItem[]) {
  const provider = getProvider(providerName)
  return provider.sync(items)
}

export interface SyncItem {
  title: string
  description?: string
  body_markdown?: string
  canonical_url: string
  type: 'blog' | 'talk' | 'article' | 'event' | 'hackathon' | 'oss' | 'video' | 'forum' | 'other'
  date?: string
}

export interface SyncProvider {
  name: string
  sync(items: SyncItem[]): Promise<{ status: string, count: number, total: number }>
}
