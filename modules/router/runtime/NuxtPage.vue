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
function onResolve () {
  nextTick(async () => {
    try {
      await nuxtApp.callHook('page:finish', component.value)
    }
    finally {
      done()
    }
  })
}
if (import.meta.client) {
  nuxtApp.hook('page:finish', () =>
    document.documentElement.scrollTo({
      top: 0,
    }),
  )
}
</script>

<template>
  <Suspense
    v-if="component"
    :suspensible="true"
    @pending="() => nuxtApp.callHook('page:start', component)"
    @resolve="onResolve"
  >
    <component
      :is="component"
      :key="route.path.includes('blog') ? route.path : undefined"
    />
  </Suspense>
</template>
