<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Articles</h1>
    </header>
    <main class="text-muted text-lg" @click="handleNavigationClicks">
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
    })
  )
})
</script>
