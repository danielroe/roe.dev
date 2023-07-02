<script setup lang="ts">
// @ts-expect-error virtual file
import routes from '#build/routes'

const nuxtApp = useNuxtApp()
const route = useRoute()

const match = (path: string) =>
  routes.find(r =>
    typeof r.path === 'string' ? r.path === path : r.path.test(path)
  )
const component = computed(() => match(route.path)?.component)
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
    route.meta = match(path)?.meta ?? {}
  }
)
</script>

<template>
  <Suspense v-if="component">
    <component :is="component" />
  </Suspense>
</template>
