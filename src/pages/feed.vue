<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Feed</h1>
    </header>
    <main
      class="text-muted text-lg -mx-4 sm:mx-auto"
      @click="handleNavigationClicks"
    >
      <TheSocialFeed />
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Feed' })
</script>
