import type { H3Event } from 'h3'

import { listRecords, blobImage } from '../atproto'
import { community, dev } from '#shared/lex'
import type { Project, ProjectCategory } from '#shared/cms/projects'

export type { Project, ProjectCategory } from '#shared/cms/projects'

const { defs } = community.lexicon.app

const ARCHIVED_STATUSES = new Set<string>([
  defs.unmaintained.value,
  defs.discontinued.value,
])

/**
 * Fetch all project categories with their projects, joined by strong-ref, each
 * sorted by `order`. Projects whose parent category isn't in the repo are
 * dropped (defence against orphans if a category was deleted without cascading
 * to its projects).
 */
export async function getProjects (event: H3Event): Promise<ProjectCategory[]> {
  const [categories, projects] = await Promise.all([
    listRecords(event, dev.roe.projectCategory.main),
    listRecords(event, dev.roe.project.main),
  ])

  const projectsByCategoryUri = new Map<string, typeof projects>()
  for (const project of projects) {
    const parentUri = project.value.category?.uri
    if (!parentUri) continue
    const bucket = projectsByCategoryUri.get(parentUri) ?? []
    bucket.push(project)
    projectsByCategoryUri.set(parentUri, bucket)
  }

  const mapped = await Promise.all(categories.map(async cat => {
    const bucket = projectsByCategoryUri.get(cat.uri) ?? []
    const items: Project[] = await Promise.all(bucket.map(async it => {
      const { $type, category, links, images, status, createdAt, ...passthrough } = it.value
      return {
        ...passthrough,
        url: linkFor(links, defs.linkRoleWebsite.value) ?? linkFor(links) ?? null,
        repo: linkFor(links, defs.linkRoleSourceCode.value) ?? null,
        archived: !!status && ARCHIVED_STATUSES.has(status),
        image: await projectImage(event, images),
      }
    }))
    items.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

    const { $type, createdAt, ...passthrough } = cat.value
    return {
      ...passthrough,
      _id: rkeyFromUri(cat.uri),
      items,
    }
  }))

  return mapped.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

type Links = dev.roe.project.Main['links']
type Images = dev.roe.project.Main['images']

/** The first link with `role`, or the first link of any role when `role` is omitted. */
function linkFor (links: Links, role?: string): string | null {
  const link = role ? links?.find(l => l.role === role) : links?.[0]
  return link?.uri ?? null
}

/**
 * The screenshot the card renders, preferring an explicit `purposeScreenshot`.
 * `community.lexicon.app.defs#image` allows either an uploaded blob or a
 * remote `uri`; we render whichever the record carries.
 */
async function projectImage (event: H3Event, images: Images): Promise<Project['image']> {
  const image = images?.find(i => i.purpose === defs.purposeScreenshot.value) ?? images?.[0]
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
