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
const id = 'dev.roe.location'

export interface Main {
  $type: 'dev.roe.location'
  city: string
  /** Region/state. Used to special-case Scotland and US/UK subdivisions on the public site. */
  region?: string
  country: string
  /** ISO 3166-1 alpha-2 country code, uppercase. Used to compute a flag emoji. */
  countryCode: string
  meetupAvailable: boolean
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
