/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons.ts'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../util.ts'

const is$typed = _is$typed,
  validate = _validate
const id = 'dev.roe.entity'

export interface Main {
  $type: 'dev.roe.entity'
  name: string
  socialHandles?: SocialHandles
  website?: string
  createdAt: string
  [k: string]: unknown
}

const hashMain = 'main'

export function isMain<V>(v: V) {
  return is$typed(v, id, hashMain)
}

export function validateMain<V>(v: V) {
  return validate<Main & V>(v, id, hashMain, true)
}

export {
  type Main as Record,
  isMain as isRecord,
  validateMain as validateRecord,
}

export interface SocialHandles {
  $type?: 'dev.roe.entity#socialHandles'
  /** Handle without leading @ (e.g. nuxt.bsky.social) */
  bluesky?: string
  /** Company or person handle (e.g. nuxtjs) */
  linkedin?: string
  /** Full handle including instance (e.g. nuxt@fosstodon.org) */
  mastodon?: string
}

const hashSocialHandles = 'socialHandles'

export function isSocialHandles<V>(v: V) {
  return is$typed(v, id, hashSocialHandles)
}

export function validateSocialHandles<V>(v: V) {
  return validate<SocialHandles & V>(v, id, hashSocialHandles)
}
