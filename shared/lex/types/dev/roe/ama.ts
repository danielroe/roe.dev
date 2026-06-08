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
const id = 'dev.roe.ama'

export interface Main {
  $type: 'dev.roe.ama'
  status: 'unanswered' | 'answered' | (string & {})
  /** AES-256-GCM envelope holding the raw question text. Present iff status=unanswered. */
  encryptedQuestion?: string
  /** Plaintext question. Present iff status=answered; the editor decrypts encryptedQuestion at publish time and writes it here so the record is self-contained going forward. */
  question?: string
  /** Thread of response posts. Each post is the body of one Bluesky-thread item (and one Mastodon status, one LinkedIn comment chain entry, etc). */
  posts?: Post[]
  platforms?: Platforms
  publishedLinks?: PublishedLinks
  image?: BlobRef
  imageDimensions?: ImageDimensions
  /** ID of the background style used to render the image. See `shared/cms/backgrounds.ts`. */
  backgroundStyle?: string
  createdAt: string
  answeredAt?: string
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

/** One post in the response thread. Mentions reference dev.roe.entity records by AT URI so the publisher can rewrite per-platform handles at publish time. */
export interface Post {
  $type?: 'dev.roe.ama#post'
  /** Body text. Plain text with `@<entity-rkey>` placeholders for entity mentions (e.g. `Thanks @abc123def456 for the help`). The placeholder syntax is internal; the publisher swaps them for the right per-platform handle. */
  text: string
  /** Strong-refs to dev.roe.entity records keyed by the placeholder token used in `text` (the entity rkey). */
  mentions?: ComAtprotoRepoStrongRef.Main[]
}

const hashPost = 'post'

export function isPost<V>(v: V) {
  return is$typed(v, id, hashPost)
}

export function validatePost<V>(v: V) {
  return validate<Post & V>(v, id, hashPost)
}

export interface Platforms {
  $type?: 'dev.roe.ama#platforms'
  bluesky: boolean
  mastodon: boolean
  linkedin: boolean
  youtubeShorts: boolean
}

const hashPlatforms = 'platforms'

export function isPlatforms<V>(v: V) {
  return is$typed(v, id, hashPlatforms)
}

export function validatePlatforms<V>(v: V) {
  return validate<Platforms & V>(v, id, hashPlatforms)
}

export interface PublishedLinks {
  $type?: 'dev.roe.ama#publishedLinks'
  bluesky?: string
  mastodon?: string
  linkedin?: string
  youtubeShorts?: string
}

const hashPublishedLinks = 'publishedLinks'

export function isPublishedLinks<V>(v: V) {
  return is$typed(v, id, hashPublishedLinks)
}

export function validatePublishedLinks<V>(v: V) {
  return validate<PublishedLinks & V>(v, id, hashPublishedLinks)
}

export interface ImageDimensions {
  $type?: 'dev.roe.ama#imageDimensions'
  width: number
  height: number
}

const hashImageDimensions = 'imageDimensions'

export function isImageDimensions<V>(v: V) {
  return is$typed(v, id, hashImageDimensions)
}

export function validateImageDimensions<V>(v: V) {
  return validate<ImageDimensions & V>(v, id, hashImageDimensions)
}
