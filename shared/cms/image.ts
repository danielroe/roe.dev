import type { ResolvedImage } from 'airspace'

/**
 * An image resolved for rendering.
 */
export interface ResolvedViewImage {
  url: string
  alt: string
  width: number | null
  height: number | null
}

export function toViewImage (image: ResolvedImage | null): ResolvedViewImage | null {
  if (!image) return null
  return {
    url: image.url,
    alt: image.alt,
    width: image.width ?? null,
    height: image.height ?? null,
  }
}
