import type { H3Event } from 'h3'

import { useAirspace } from '../airspace'
import { toViewImage } from '#shared/cms/image'
import type { Project, ProjectCategory } from '#shared/cms/projects'
import type { ProjectRecord } from '#shared/cms/records'

export type { Project, ProjectCategory } from '#shared/cms/projects'

const LINK_ROLE_WEBSITE = 'community.lexicon.app.defs#linkRoleWebsite'
const LINK_ROLE_SOURCE_CODE = 'community.lexicon.app.defs#linkRoleSourceCode'
const PURPOSE_SCREENSHOT = 'community.lexicon.app.defs#purposeScreenshot'

const ARCHIVED_STATUSES = new Set([
  'community.lexicon.app.defs#unmaintained',
  'community.lexicon.app.defs#discontinued',
])

/**
 * Every category with its projects, joined by strong-ref and each sorted by
 * `order`. Projects whose parent category isn't in the repo are dropped
 * (defence against orphans if a category was deleted without cascading).
 */
export async function getProjects (event: H3Event): Promise<ProjectCategory[]> {
  const airspace = useAirspace(event)
  const [categories, projects] = await Promise.all([
    airspace.projectCategories.list(),
    airspace.projects.list(),
  ])

  const byCategoryUri = new Map<string, typeof projects>()
  for (const project of projects) {
    const parentUri = project.value.category?.uri
    if (!parentUri) continue
    byCategoryUri.set(parentUri, [...byCategoryUri.get(parentUri) ?? [], project])
  }

  return await Promise.all(categories.map(async cat => {
    const bucket = byCategoryUri.get(cat.uri) ?? []
    const items: Project[] = await Promise.all(bucket.map(async it => {
      const { $type, category, links, images, status, createdAt, ...passthrough } = it.value
      const image = images?.find(i => i.purpose === PURPOSE_SCREENSHOT) ?? images?.[0]
      return {
        ...passthrough,
        url: linkFor(links, LINK_ROLE_WEBSITE) ?? linkFor(links) ?? null,
        repo: linkFor(links, LINK_ROLE_SOURCE_CODE) ?? null,
        archived: !!status && ARCHIVED_STATUSES.has(status),
        image: toViewImage(await airspace.blobs.image(image)),
      }
    }))

    const { $type, createdAt, ...passthrough } = cat.value
    return { ...passthrough, _id: cat.rkey, items }
  }))
}

type Links = ProjectRecord['links']

/** The first link with `role`, or the first link of any role when `role` is omitted. */
function linkFor (links: Links, role?: string): string | null {
  const link = role ? links?.find(l => l.role === role) : links?.[0]
  return link?.uri ?? null
}
