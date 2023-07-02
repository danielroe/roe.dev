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
console.log(route.path, match(route.path))
nuxtApp.hooks.hook('link:prefetch', url => {
  const path = match(url)
  if (path && path.component && path.component.__asyncResolved !== true) {
    path.component.__asyncLoader()
  }
})
onMounted(() => {
  nuxtApp.hooks.callHook('app:suspense:resolve')
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
  <Suspense v-if="component">
    <component :is="component" />
  </Suspense>
</template>
