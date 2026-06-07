/**
 * Per-platform text resolution shared by the publish endpoints. Pulls the
 * entity lookup once and exposes helpers that produce the
 * platform-specific text + (for Bluesky) facets.
 */
import type { H3Event } from 'h3'

import { listAdminRecords } from './crud'
import { resolveForPlatform, resolveBluesky } from './ama-mentions'
import type { EntityLookup } from './ama-mentions'
import type { ResolvedPost } from './ama-publish'
import type { DevRoeEntity } from '#shared/lex'

export const FOOTER = '\n\nroe.dev/ama\n\n#ama'

export interface AmaPostInput {
  text: string
  mentions?: Array<{ uri: string, cid: string }>
}

export async function buildEntityLookup (event: H3Event): Promise<EntityLookup> {
  const records = await listAdminRecords(event, 'dev.roe.entity')
  const byRkey = new Map<string, DevRoeEntity.Record>()
  for (const r of records) byRkey.set(r.rkey, r.value)
  return { byRkey }
}

/** Concatenated platform-specific text for Mastodon / LinkedIn, with footer. */
export function platformText (
  posts: AmaPostInput[],
  platform: 'mastodon' | 'linkedin',
  entities: EntityLookup,
): string {
  return posts
    .map(p => resolveForPlatform(p.text, platform, entities))
    .filter(Boolean)
    .join('\n\n') + FOOTER
}

/** Per-post Bluesky thread items, with footer on the *last* post. */
export function blueskyThread (
  posts: AmaPostInput[],
  entities: EntityLookup,
): ResolvedPost[] {
  return posts.map((p, i) => {
    const withFooter = i === posts.length - 1 ? p.text + FOOTER : p.text
    return resolveBluesky(withFooter, entities)
  })
}
