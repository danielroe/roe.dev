export default defineNuxtPlugin(nuxtApp => {
  const router = useRouter()
  let finalise: () => void
  const promise = new Promise<void>(resolve => {
    finalise = resolve
  })

  // @ts-expect-error
  router._preloadPromises = Array.from({ length: 5 }).map(() => promise)

  nuxtApp.hook('app:mounted', () => {
    // @ts-expect-error
    window.__mounted = true
    requestIdleCallback(finalise)
  })
})
