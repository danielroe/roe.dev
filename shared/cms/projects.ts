import type { dev } from '../lex/index.ts'
import type { Strict } from './strict.ts'

/**
 * The view model the /projects page renders. Records store
 * `community.lexicon.app.defs` links and images; the read path picks the ones
 * the page uses (site link, source link, screenshot) so the page doesn't have
 * to know about link roles and image purposes.
 */
export type Project = Omit<Strict<dev.roe.project.Main>, '$type' | 'category' | 'links' | 'images' | 'status' | 'createdAt'> & {
  url: string | null
  repo: string | null
  archived: boolean
  image: {
    url: string
    alt: string
    width: number | null
    height: number | null
  } | null
}

export type ProjectCategory = Omit<Strict<dev.roe.projectCategory.Main>, '$type' | 'createdAt'> & {
  _id: string
  items: Project[]
}
