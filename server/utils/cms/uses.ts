import type { H3Event } from 'h3'

import { listRecords, blobUrl } from '../atproto'
import type { UsesCategory, UsesItem } from '#shared/cms/uses'

export type { UsesCategory, UsesItem } from '#shared/cms/uses'

/**
 * Fetch all categories with their items, joined by strong-ref. Items whose
 * parent category isn't in the repo are dropped (defence against orphans
 * if a category was deleted without cascading to its items).
 */
export async function getUses (event: H3Event): Promise<UsesCategory[]> {
  const [categories, items] = await Promise.all([
    listRecords(event, 'dev.roe.usesCategory'),
    listRecords(event, 'dev.roe.usesItem'),
  ])

  const itemsByCategoryUri = new Map<string, typeof items>()
  for (const item of items) {
    const parentUri = item.value.category?.uri
    if (!parentUri) continue
    const bucket = itemsByCategoryUri.get(parentUri) ?? []
    bucket.push(item)
    itemsByCategoryUri.set(parentUri, bucket)
  }

  return Promise.all(categories.map(async cat => {
    const bucket = itemsByCategoryUri.get(cat.uri) ?? []
    const mappedItems: UsesItem[] = await Promise.all(bucket.map(async it => {
      const { $type, category, image, createdAt, ...passthrough } = it.value
      return {
        ...passthrough,
        image: image ? await blobUrl(event, image) : null,
      }
    }))

    const { $type, createdAt, ...passthrough } = cat.value
    return {
      ...passthrough,
      _id: rkeyFromUri(cat.uri),
      items: mappedItems,
    }
  }))
}

function rkeyFromUri (uri: string): string {
  const i = uri.lastIndexOf('/')
  return i === -1 ? uri : uri.slice(i + 1)
}
