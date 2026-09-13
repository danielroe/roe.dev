import type { ProjectCategoryRecord, ProjectRecord } from './records.ts'
import type { ResolvedViewImage } from './image.ts'

/**
 * The view model the /projects page renders. Records store
 * `community.lexicon.app.defs` links and images; the read path picks the ones
 * the page uses (site link, source link, screenshot) so the page doesn't have
 * to know about link roles and image purposes.
 */
export type Project = Omit<ProjectRecord, '$type' | 'category' | 'links' | 'images' | 'status' | 'createdAt'> & {
  url: string | null
  repo: string | null
  archived: boolean
  image: ResolvedViewImage | null
}

export type ProjectCategory = Omit<ProjectCategoryRecord, '$type' | 'createdAt'> & {
  _id: string
  items: Project[]
}
