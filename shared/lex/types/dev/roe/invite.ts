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
const id = 'dev.roe.invite'

export interface Main {
  $type: 'dev.roe.invite'
  /** AES-256-GCM envelope (see server/utils/admin/encryption.ts) holding { slug, repo } as JSON. Opaque to anyone without the server key. */
  encrypted: string
  /** Whether this invite is currently honoured. Inactive invites stay around for audit but don't get wired up in the route table. */
  isActive: boolean
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
