import type { H3Event } from 'h3'

import { useAirspace } from '../airspace'
import { toViewImage } from '#shared/cms/image'
import type { UsesCategory, UsesItem } from '#shared/cms/uses'

export type { UsesCategory, UsesItem } from '#shared/cms/uses'

/**
 * Every category with its items, joined by strong-ref. Items whose parent
 * category isn't in the repo are dropped (defence against orphans if a
 * category was deleted without cascading).
 */
export async function getUses (event: H3Event): Promise<UsesCategory[]> {
  const airspace = useAirspace(event)
  const [categories, items] = await Promise.all([
    airspace.usesCategories.list(),
    airspace.usesItems.list(),
  ])

  const byCategoryUri = new Map<string, typeof items>()
  for (const item of items) {
    const parentUri = item.value.category?.uri
    if (!parentUri) continue
    byCategoryUri.set(parentUri, [...byCategoryUri.get(parentUri) ?? [], item])
  }

  return await Promise.all(categories.map(async cat => {
    const bucket = byCategoryUri.get(cat.uri) ?? []
    const mappedItems: UsesItem[] = await Promise.all(bucket.map(async it => {
      const { $type, category, image, links, createdAt, ...passthrough } = it.value
      return {
        ...passthrough,
        links: (links ?? []).map(link => ({
          uri: link.uri,
          ...(link.label ? { label: link.label } : {}),
        })),
        image: toViewImage(await airspace.blobs.image(image)),
      }
    }))

    const { $type, createdAt, ...passthrough } = cat.value
    return { ...passthrough, _id: cat.rkey, items: mappedItems }
  }))
}
