<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Articles</h1>
    </header>
    <main class="text-lg">
      <TheBlogIndex @click.prevent="handleNavigation" />
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Blog' })

function handleNavigation(e: MouseEvent | KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'A') {
    const href = target.getAttribute('href')
    if (href) navigateTo(href)
  }
}

const nuxtApp = useNuxtApp()
onMounted(() => {
  document.querySelectorAll('a').forEach(a => {
    nuxtApp.hooks.callHook('link:prefetch', a.getAttribute('href')!)
  })
})
</script>
