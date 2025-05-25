<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">
        some of what I use
      </h1>
    </header>
    <main
      class="text-muted text-lg max-w-[37.50rem] text-base"
    >
      <TheUses />
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Uses' })
</script>
