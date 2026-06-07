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
const id = 'dev.roe.talk'

export interface Main {
  $type: 'dev.roe.talk'
  /** Optional for upcoming events with no announced title. Required for past talks unless the talk is part of a group. */
  title?: string
  description?: string
  /** Start date of the talk/event. Date-only values are stored as midnight UTC. */
  date: string
  /** End date for multi-day events. Optional. */
  endDate?: string
  /** Conference name, meetup, podcast title, etc. */
  source: string
  /** Free-form: city, country, or 'Online'. */
  location?: string
  type:
    | 'conference'
    | 'meetup'
    | 'podcast'
    | 'workshop'
    | 'stream'
    | 'talk'
    | (string & {})
  tags?: string[]
  /** Event page, podcast episode URL, etc. */
  link?: string
  video?: string
  /** Identifier for slides; historically a GitHub release tag from danielroe/slides. */
  slides?: string
  demo?: string
  repo?: string
  group?: ComAtprotoRepoStrongRef.Main
  image?: BlobRef
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
