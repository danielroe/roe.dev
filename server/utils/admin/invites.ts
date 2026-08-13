import type { AdminRecord } from './crud'
import { decryptJSON } from './encryption'
import type { dev } from '#shared/lex'

export interface InviteView {
  rkey: string
  uri: string
  cid: string
  slug: string
  repo: string
  isActive: boolean
  createdAt: string
}

/** Decrypt an invite record into the shape exposed to the editor. */
export function decryptInvite (r: AdminRecord<typeof dev.roe.invite.main>): InviteView {
  let slug = ''
  let repo = ''
  try {
    ;({ slug, repo } = decryptJSON<{ slug: string, repo: string }>(r.value.encrypted))
  }
  catch (err) {
    console.warn(`[admin/invites] Failed to decrypt ${r.uri}:`, err instanceof Error ? err.message : err)
  }
  return {
    rkey: r.rkey,
    uri: r.uri,
    cid: r.cid,
    slug,
    repo,
    isActive: r.value.isActive,
    createdAt: r.value.createdAt,
  }
}
