import { GithubStarsProvider } from './github-stars'
import { DevToProvider } from './dev-to'
import { GdeAdvocuProvider } from './gde-advocu'
import { StandardSiteProvider } from './standard-site'

const providers = {
  'github-stars': new GithubStarsProvider(),
  'dev-to': new DevToProvider(),
  'gde-advocu': new GdeAdvocuProvider(),
  'standard-site': new StandardSiteProvider(),
} satisfies Record<string, SyncProvider>

type ProviderName = keyof typeof providers

export const providerNames = Object.keys(providers) as ProviderName[]

function getProvider (name: ProviderName): SyncProvider {
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown sync provider: ${name}`)
  return provider
}

export async function syncWithProvider (providerName: ProviderName, items: SyncItem[]) {
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
  tags?: string[]
}

export interface SyncProvider {
  name: string
  sync(items: SyncItem[]): Promise<{ status: string, count: number, total: number }>
}
