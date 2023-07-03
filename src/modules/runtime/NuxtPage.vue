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
    path.component.__asyncLoader()
  }
})
</script>

<template>
  <Suspense
    v-if="component"
    @resolve="() => nuxtApp.hooks.callHook('app:suspense:resolve')"
  >
    <component :is="component" />
  </Suspense>
</template>
