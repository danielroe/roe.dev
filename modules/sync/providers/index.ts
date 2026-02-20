import { GithubStarsProvider } from './github-stars'
import { DevToProvider } from './dev-to'
import { GdeAdvocuProvider } from './gde-advocu'
import { StandardSiteProvider } from './standard-site'

export interface SyncItem {
  title: string
  description?: string
  body_markdown?: string
  text_content?: string
  canonical_url: string
  type: 'blog' | 'talk' | 'article' | 'event' | 'hackathon' | 'oss' | 'video' | 'forum' | 'other'
  date?: string
  tags?: string[]
}

export interface SyncOptions {
  dryRun: boolean
}

export interface SyncProvider {
  name: string
  sync(items: SyncItem[], options: SyncOptions): Promise<void>
}

function createProviders (): SyncProvider[] {
  return [
    new GithubStarsProvider(),
    new DevToProvider(),
    new GdeAdvocuProvider(),
    new StandardSiteProvider(),
  ]
}

export async function syncAll (items: SyncItem[], options: SyncOptions): Promise<void> {
  await Promise.all(createProviders().map(async provider => {
    try {
      await provider.sync(items, options)
    }
    catch (error) {
      console.warn(`[sync:${provider.name}] Failed:`, error instanceof Error ? error.message : error)
    }
  }))
}
