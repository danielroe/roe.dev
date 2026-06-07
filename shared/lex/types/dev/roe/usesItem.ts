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
import type * as ComAtprotoRepoStrongRef from '../../com/atproto/repo/strongRef.ts'

const is$typed = _is$typed,
  validate = _validate
const id = 'dev.roe.usesItem'

export interface Main {
  $type: 'dev.roe.usesItem'
  category: ComAtprotoRepoStrongRef.Main
  name: string
  description?: string
  /** Lower values render first within the category. Defaults to 100 in the editor. */
  order: number
  image?: BlobRef
  aspectRatio?: AspectRatio
  links?: Link[]
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

export interface Link {
  $type?: 'dev.roe.usesItem#link'
  url: string
  label?: string
}

const hashLink = 'link'

export function isLink<V>(v: V) {
  return is$typed(v, id, hashLink)
}

export function validateLink<V>(v: V) {
  return validate<Link & V>(v, id, hashLink)
}

/** width:height of an image in pixels. Mirrors `app.bsky.embed.defs#aspectRatio`. */
export interface AspectRatio {
  $type?: 'dev.roe.usesItem#aspectRatio'
  width: number
  height: number
}

const hashAspectRatio = 'aspectRatio'

export function isAspectRatio<V>(v: V) {
  return is$typed(v, id, hashAspectRatio)
}

export function validateAspectRatio<V>(v: V) {
  return validate<AspectRatio & V>(v, id, hashAspectRatio)
}
