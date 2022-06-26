export default defineNuxtPlugin(() => {
  useHead({
    // TODO: fix index issue
    titleTemplate: title => (title ? `${title} - Daniel Roe` : 'Daniel Roe'),
  })
})
