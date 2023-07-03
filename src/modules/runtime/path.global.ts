import { match } from './routes'

export default defineNuxtRouteMiddleware(to => {
  const path = to.path
  const matched = match(path)
  Object.assign(to.meta, matched?.meta)
  if (matched?.path instanceof RegExp) {
    to.params =
      (path.match(matched.path)?.groups as Record<string, string>) || {}
  }
})
