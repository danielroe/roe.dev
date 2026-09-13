/**
 * Plain-JSON record values for each collection.
 */
import type { Infer, Plain } from 'airspace'

import type lexicons from '../../lexicons.ts'

/** `cms` is a permission set rather than a record. */
type RecordKey = Exclude<keyof typeof lexicons, 'cms'>

type Value<K extends RecordKey> = Plain<Infer<(typeof lexicons)[K]>>

export type AmaRecord = Value<'ama'>
export type EntityRecord = Value<'entity'>
export type LocationRecord = Value<'location'>
export type ProjectRecord = Value<'project'>
export type ProjectCategoryRecord = Value<'projectCategory'>
export type TalkRecord = Value<'talk'>
export type TalkGroupRecord = Value<'talkGroup'>
export type UsesCategoryRecord = Value<'usesCategory'>
export type UsesItemRecord = Value<'usesItem'>

/** Which platforms the editor enabled when publishing an AMA answer. */
export type AmaPlatforms = NonNullable<AmaRecord['platforms']>

/** Resolved per-platform URLs after an AMA answer is published. */
export type AmaPublishedLinks = NonNullable<AmaRecord['publishedLinks']>

/** One post in an AMA response thread. */
export type AmaPost = NonNullable<AmaRecord['posts']>[number]

/** `com.atproto.repo.strongRef` */
export interface StrongRef {
  uri: string
  cid: string
}
