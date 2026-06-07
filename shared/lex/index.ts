/**
 * Auto-generated barrel for the dev.roe lexicons. Re-run `pnpm lex:gen` to
 * refresh after adding or removing lexicon JSON files.
 *
 * The generated `gen-api` client surface was deleted because we drive the PDS
 * via the existing `AtpAgent` from `@atproto/api`; we only need the typed
 * record interfaces and the validator registry.
 */
export { schemas, lexicons, validate, schemaDict } from './lexicons.ts'
export type { $Typed, Un$Typed, OmitKey } from './util.ts'

export * as ComAtprotoRepoStrongRef from './types/com/atproto/repo/strongRef.ts'
export * as DevRoeAma from './types/dev/roe/ama.ts'
export * as DevRoeEntity from './types/dev/roe/entity.ts'
export * as DevRoeInvite from './types/dev/roe/invite.ts'
export * as DevRoeLocation from './types/dev/roe/location.ts'
export * as DevRoeSync from './types/dev/roe/sync.ts'
export * as DevRoeTalk from './types/dev/roe/talk.ts'
export * as DevRoeTalkGroup from './types/dev/roe/talkGroup.ts'
export * as DevRoeUsesCategory from './types/dev/roe/usesCategory.ts'
export * as DevRoeUsesItem from './types/dev/roe/usesItem.ts'
