/**
 * Per-platform mention + link resolution for AMA posts.
 *
 * Post text uses two placeholder forms:
 *   - `@<entity-rkey>` for entity mentions.
 *   - `[label](url)` for inline links.
 *
 * At publish time we swap each placeholder for the platform-appropriate form:
 *
 * Mentions
 *   - Bluesky: `@<bluesky handle>` plus a `app.bsky.richtext.facet#mention`
 *     facet at the right byte range, so the AppView resolves it to a link.
 *   - Mastodon: `@<mastodon handle>`.
 *   - LinkedIn: `https://www.linkedin.com/in/<linkedin handle>`.
 *
 * Links
 *   - Bluesky: keeps the label visible with a facet on the label range.
 *   - Mastodon / LinkedIn: `label (url)`.
 */
import type { AppBskyRichtextFacet } from '@atproto/api'

import type { DevRoeEntity } from '#shared/lex'

export type Platform = 'bluesky' | 'mastodon' | 'linkedin'

export interface EntityLookup {
  /** Entity rkey → record value. */
  byRkey: Map<string, DevRoeEntity.Record>
}

const MENTION_RE = /@([a-z0-9]{13})\b/g
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g

interface Token {
  start: number
  end: number
  kind: 'mention' | 'link'
  rkey?: string
  label?: string
  url?: string
}

function tokenise (text: string): Token[] {
  const out: Token[] = []
  for (const m of text.matchAll(MENTION_RE)) {
    out.push({ start: m.index!, end: m.index! + m[0].length, kind: 'mention', rkey: m[1]! })
  }
  for (const m of text.matchAll(LINK_RE)) {
    out.push({ start: m.index!, end: m.index! + m[0].length, kind: 'link', label: m[1]!, url: m[2]! })
  }
  return out.sort((a, b) => a.start - b.start)
}

export function resolveForPlatform (
  text: string,
  platform: 'mastodon' | 'linkedin',
  entities: EntityLookup,
): string {
  const tokens = tokenise(text)
  let out = ''
  let cursor = 0
  for (const t of tokens) {
    out += text.slice(cursor, t.start)
    if (t.kind === 'mention') {
      const handles = entities.byRkey.get(t.rkey!)?.socialHandles
      if (handles) {
        if (platform === 'mastodon') {
          out += handles.mastodon ? `@${handles.mastodon}` : ''
        }
        else {
          out += handles.linkedin ? `https://www.linkedin.com/in/${handles.linkedin}` : ''
        }
      }
    }
    else {
      out += `${t.label} (${t.url})`
    }
    cursor = t.end
  }
  out += text.slice(cursor)
  return out.replace(/  +/g, ' ').trim()
}

/**
 * Resolve placeholders for Bluesky and emit facets covering the resulting
 * handles, link labels, hashtags, and bare URLs. Mention facets store the
 * *handle* in `did`; the caller resolves to a real DID just before posting.
 */
export function resolveBluesky (
  text: string,
  entities: EntityLookup,
): { text: string, facets: AppBskyRichtextFacet.Main[] } {
  const facets: AppBskyRichtextFacet.Main[] = []
  const tokens = tokenise(text)
  let out = ''
  let cursor = 0

  for (const t of tokens) {
    out += text.slice(cursor, t.start)

    if (t.kind === 'mention') {
      const handle = entities.byRkey.get(t.rkey!)?.socialHandles?.bluesky
      if (handle) {
        const mentionText = `@${handle}`
        const byteStart = Buffer.byteLength(out, 'utf8')
        out += mentionText
        const byteEnd = Buffer.byteLength(out, 'utf8')
        facets.push({
          index: { byteStart, byteEnd },
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: handle }],
        })
      }
    }
    else {
      const byteStart = Buffer.byteLength(out, 'utf8')
      out += t.label!
      const byteEnd = Buffer.byteLength(out, 'utf8')
      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: t.url! }],
      })
    }
    cursor = t.end
  }
  out += text.slice(cursor)

  for (const m of out.matchAll(/#([\w-]+)/g)) {
    const tag = m[1]!
    const byteStart = Buffer.byteLength(out.slice(0, m.index!), 'utf8')
    const byteEnd = byteStart + Buffer.byteLength(m[0], 'utf8')
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag }],
    })
  }

  // Bare URL facets (http(s)://... or domain.tld/path) for URLs typed
  // directly. Skip ranges already covered by a link / mention facet.
  const urlRegex = /https?:\/\/[^\s]+|(?:[a-z0-9][a-z0-9-]*\.)+[a-z]{2,}(?:\/[^\s]*)?/gi
  for (const m of out.matchAll(urlRegex)) {
    const raw = m[0]
    if (raw.startsWith('#')) continue
    const byteStart = Buffer.byteLength(out.slice(0, m.index!), 'utf8')
    const byteEnd = byteStart + Buffer.byteLength(raw, 'utf8')
    const overlap = facets.some(f => f.index.byteStart < byteEnd && f.index.byteEnd > byteStart)
    if (overlap) continue
    const uri = raw.startsWith('http') ? raw : `https://${raw}`
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
    })
  }

  return { text: out, facets }
}
