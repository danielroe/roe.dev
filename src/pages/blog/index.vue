<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">
        stuff I've written
      </h1>
    </header>
    <main
      class="text-muted text-lg"
      @click="handleNavigationClicks"
    >
      <TheBlogIndex />
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Blog' })

const nuxtApp = useNuxtApp()
onMounted(() => {
  nextTick(() =>
    document.querySelectorAll('main a').forEach(a => {
      nuxtApp.hooks.callHook('link:prefetch', a.getAttribute('href')!)
    }),
  )
})
</script>
