export default defineNuxtPlugin(nuxtApp => {
  window.requestIdleCallback(() => {
    nuxtApp.isIdle = true
  })
})
