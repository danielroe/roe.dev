import type { DevRoeUsesCategory, DevRoeUsesItem } from '../lex/index.ts'
import type { Strict } from './strict.ts'

export type UsesItem = Omit<Strict<DevRoeUsesItem.Record>, '$type' | 'category' | 'image' | 'createdAt'> & {
  image: {
    url: string
    width: number | null
    height: number | null
  } | null
}

export type UsesCategory = Omit<Strict<DevRoeUsesCategory.Record>, '$type' | 'createdAt'> & {
  _id: string
  items: UsesItem[]
}
