import type { UsesCategoryRecord, UsesItemRecord } from './records.ts'
import type { ResolvedViewImage } from './image.ts'

export type UsesItem = Omit<UsesItemRecord, '$type' | 'category' | 'image' | 'links' | 'createdAt'> & {
  links: { uri: string, label?: string }[]
  image: ResolvedViewImage | null
}

export type UsesCategory = Omit<UsesCategoryRecord, '$type' | 'createdAt'> & {
  _id: string
  items: UsesItem[]
}
