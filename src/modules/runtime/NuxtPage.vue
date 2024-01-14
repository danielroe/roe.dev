<script setup lang="ts">
import { match } from './routes'

const nuxtApp = useNuxtApp()
const route = useRoute()

const component = computed(() => match(route.path)?.component)
const preloadedPages = new Set<string>([route.path])
nuxtApp.hooks.hook('link:prefetch', url => {
  if (preloadedPages.has(url)) return
  preloadedPages.add(url)
  const path = match(url)
  if (path && path.component && path.component.__asyncResolved !== true) {
    path.component.__asyncLoader?.()
  }
})
const done = nuxtApp.deferHydration()
if (process.client) {
  nuxtApp.hook('page:finish', () =>
    document.documentElement.scrollTo({
      top: 0,
    })
  )
}
</script>

<template>
  <Suspense
    v-if="component"
    :suspensible="true"
    @pending="() => nuxtApp.callHook('page:start', component)"
    @resolve="
      () => {
        nextTick(() => nuxtApp.callHook('page:finish', component).finally(done))
      }
    "
  >
    <component :is="component" />
  </Suspense>
</template>
