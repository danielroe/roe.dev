import { componentNames } from '#components'

export default defineNuxtPlugin(nuxtApp => {
  const router = useRouter()
  const resolves: Array<() => void> = []
  const finalise = () => {
    // @ts-expect-error
    router._preloadPromises.length = 0
    resolves.forEach(resolve => resolve())
    resolves.length = 0
  }

  // @ts-expect-error
  router._preloadPromises = Array.from({ length: 5 }).map(
    () =>
      new Promise<void>(resolve => {
        resolves.push(resolve)
      })
  )

  nuxtApp.hook('app:mounted', () => {
    // @ts-expect-error
    window.__mounted = true

    requestIdleCallback(() => {
      finalise()
    })
    requestIdleCallback(() => {
      preloadComponents('ContentRendererMarkdown')
    })
  })
})
