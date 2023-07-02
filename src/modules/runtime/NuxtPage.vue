<script setup lang="ts">
// @ts-expect-error virtual file
import _routes from '#build/routes'

const nuxtApp = useNuxtApp()
const route = useRoute()

interface NuxtRoute {
  path: string | RegExp
  component: any
  meta?: Record<string, any>
}

const routes: NuxtRoute[] = _routes
const match = (path: string) =>
  routes.find(r =>
    typeof r.path === 'string' ? r.path === path : r.path.test(path)
  )
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

watch(
  () => route.path,
  (path: string) => {
    const matched = match(path)
    route.meta = matched?.meta ?? {}
    if (matched?.path instanceof RegExp) {
      route.params = path.match(matched.path)?.groups
    }
  },
  { immediate: true }
)
</script>

<template>
  <Suspense
    v-if="component"
    @resolve="() => nuxtApp.hooks.callHook('app:suspense:resolve')"
  >
    <component :is="component" />
  </Suspense>
</template>
