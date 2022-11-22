export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('app:mounted', () => {
    // @ts-expect-error
    window.__mounted = true
  })
  const router = useRouter()
  let finalise: () => void
  const promise = new Promise<void>(resolve => {
    finalise = resolve
  })

  // @ts-expect-error
  router._preloadPromises = Array.from({ length: 5 }).map(() => promise)

  addEventListener('load', () => {
    requestIdleCallback(finalise)
  })
})
