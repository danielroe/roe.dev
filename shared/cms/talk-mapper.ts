import type { DevRoeTalk, DevRoeTalkGroup } from '../lex/index.ts'
import type { Talk, TalkGroup } from './talks.ts'

/** Extract the rkey from an `at://did/collection/rkey` URI. */
export function rkeyFromUri (uri: string): string {
  const i = uri.lastIndexOf('/')
  return i === -1 ? uri : uri.slice(i + 1)
}

export interface PdsTalkInput {
  uri: string
  value: DevRoeTalk.Record
}

export interface PdsTalkGroupInput {
  uri: string
  value: DevRoeTalkGroup.Record
}

export function toTalk (input: PdsTalkInput, group?: PdsTalkGroupInput): Talk {
  const { $type, createdAt, endDate, location, image, title, group: _strongRef, ...passthrough } = input.value
  return {
    ...passthrough,
    _id: rkeyFromUri(input.uri),
    title: title ?? '',
    ...(group ? { group: toTalkGroup(group) } : {}),
  }
}

function toTalkGroup (input: PdsTalkGroupInput): TalkGroup {
  const { $type, createdAt, ...passthrough } = input.value
  return {
    ...passthrough,
    _id: rkeyFromUri(input.uri),
  }
}
