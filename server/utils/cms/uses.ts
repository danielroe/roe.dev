import type { H3Event } from 'h3'

import { listRecords, blobImage } from '../atproto'
import { dev } from '#shared/lex'
import type { UsesCategory, UsesItem } from '#shared/cms/uses'

export type { UsesCategory, UsesItem } from '#shared/cms/uses'

/**
 * Fetch all categories with their items, joined by strong-ref. Items whose
 * parent category isn't in the repo are dropped (defence against orphans
 * if a category was deleted without cascading to its items).
 */
export async function getUses (event: H3Event): Promise<UsesCategory[]> {
  const [categories, items] = await Promise.all([
    listRecords(event, dev.roe.usesCategory.main),
    listRecords(event, dev.roe.usesItem.main),
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
      const { $type, category, image, links, createdAt, ...passthrough } = it.value
      return {
        ...passthrough,
        links: (links ?? []).map(link => ({
          uri: link.uri,
          ...(link.label ? { label: link.label } : {}),
        })),
        image: await usesImage(event, image),
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

type UsesImage = dev.roe.usesItem.Main['image']

/**
 * `community.lexicon.app.defs#image` allows either an uploaded blob or a remote
 * `uri`; render whichever the record carries.
 */
async function usesImage (event: H3Event, image: UsesImage): Promise<UsesItem['image']> {
  if (!image) return null

  if (image.image) {
    const blob = await blobImage(event, image.image, image.aspectRatio)
    return blob ? { ...blob, alt: image.alt } : null
  }

  if (!image.uri) return null
  return {
    url: image.uri,
    alt: image.alt,
    width: image.aspectRatio?.width ?? null,
    height: image.aspectRatio?.height ?? null,
  }
}

function rkeyFromUri (uri: string): string {
  const i = uri.lastIndexOf('/')
  return i === -1 ? uri : uri.slice(i + 1)
}
