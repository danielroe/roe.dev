export default defineNuxtPlugin({
  order: -50,
  setup: () => { useScriptCloudflareWebAnalytics() },
})
