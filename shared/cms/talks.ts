import type { TalkGroupRecord, TalkRecord } from './records.ts'

type DroppedHousekeeping = '$type' | 'createdAt'
type UpcomingOnly = 'endDate' | 'location' | 'image'

export type TalkGroup = Omit<TalkGroupRecord, DroppedHousekeeping> & {
  _id: string
}

export type Talk = Omit<TalkRecord, DroppedHousekeeping | UpcomingOnly | 'title' | 'group'> & {
  _id: string
  title: string
  group?: TalkGroup
}
