import type { DevRoeTalk, DevRoeTalkGroup } from '../lex/index.ts'
import type { Strict } from './strict.ts'

type DroppedHousekeeping = '$type' | 'createdAt'
type UpcomingOnly = 'endDate' | 'location' | 'image'

export type TalkGroup = Omit<Strict<DevRoeTalkGroup.Record>, DroppedHousekeeping> & {
  _id: string
}

export type Talk = Omit<Strict<DevRoeTalk.Record>, DroppedHousekeeping | UpcomingOnly | 'title' | 'group'> & {
  _id: string
  title: string
  group?: TalkGroup
}
