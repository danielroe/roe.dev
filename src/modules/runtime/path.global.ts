import type { RouteLocationNormalized, RouteRecordNormalized } from 'vue-router'
import { match } from './routes'

export default defineNuxtRouteMiddleware((to, from) => {
  const path = to.path
  const matched = match(path)
  Object.assign(to.meta, matched?.meta)
  augmentMatched(from)
  augmentMatched(to)
  if (matched?.path instanceof RegExp) {
    to.params =
      (path.match(matched.path)?.groups as Record<string, string>) || {}
  }
})

function augmentMatched(route: RouteLocationNormalized) {
  route.matched = [
    {
      components: {
        default: match(route.path)?.component.__asyncResolved?.__name,
      },
    } as any as RouteRecordNormalized,
  ]
}
