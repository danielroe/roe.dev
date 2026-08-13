import type { dev } from '../lex/index.ts'
import type { Strict } from './strict.ts'

type DroppedHousekeeping = '$type' | 'createdAt'
type UpcomingOnly = 'endDate' | 'location' | 'image'

export type TalkGroup = Omit<Strict<dev.roe.talkGroup.Main>, DroppedHousekeeping> & {
  _id: string
}

export type Talk = Omit<Strict<dev.roe.talk.Main>, DroppedHousekeeping | UpcomingOnly | 'title' | 'group'> & {
  _id: string
  title: string
  group?: TalkGroup
}
