import type { dev } from '../lex/index.ts'
import type { Strict } from './strict.ts'

export type UsesItem = Omit<Strict<dev.roe.usesItem.Main>, '$type' | 'category' | 'image' | 'links' | 'createdAt'> & {
  links: { uri: string, label?: string }[]
  image: {
    url: string
    alt: string
    width: number | null
    height: number | null
  } | null
}

export type UsesCategory = Omit<Strict<dev.roe.usesCategory.Main>, '$type' | 'createdAt'> & {
  _id: string
  items: UsesItem[]
}
