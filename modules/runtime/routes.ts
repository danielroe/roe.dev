import { withoutTrailingSlash } from 'ufo'
import _routes from '#build/routes'

interface NuxtRoute {
  path: string | RegExp
  component: any
  meta?: Record<string, any>
}

export const routes: NuxtRoute[] = _routes
export const match = (path: string) =>
  routes.find(r =>
    typeof r.path === 'string' ? r.path === withoutTrailingSlash(path) : r.path.test(withoutTrailingSlash(path)),
  )
