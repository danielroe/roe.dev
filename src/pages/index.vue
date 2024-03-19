<script setup lang="ts">
const avatar = useNuxtApp().$auth.user.avatar
useHead({
  style: [
    {
      innerHTML: `
img[data-image-src='${avatar || 'null'}'] {
  border-style: solid;
  border-width: 1px;

  --tw-border-opacity: 1;

  border-color: rgb(250 204 21 / var(--tw-border-opacity));
}`,
    },
  ],
})

const nuxtApp = useNuxtApp()
onNuxtReady(() =>
  document.querySelectorAll('main a').forEach(a => {
    const href = a.getAttribute('href')
    if (href && !href.startsWith('mailto:'))
      nuxtApp.hooks.callHook('link:prefetch', href)
  }),
)
</script>

<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">
        welcome!
      </h1>
    </header>
    <main
      class="text-muted"
      @click="handleNavigationClicks"
    >
      <TheHome />
    </main>
  </div>
</template>
