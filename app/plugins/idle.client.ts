export default defineNuxtPlugin(nuxtApp => {
  requestIdleCallback(() => {
    nuxtApp.isIdle = true
  })
})
