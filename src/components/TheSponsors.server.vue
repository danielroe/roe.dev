<script setup lang="ts">
const sponsors = await $fetch<string[]>('/api/sponsors')
</script>

<template>
  <div
    class="flex gap-3 flex-row flex-wrap max-w-md mx-auto justify-center relative"
  >
    <nuxt-img
      v-for="sponsor of sponsors"
      :key="sponsor"
      :data-image-src="sponsor"
      sizes="sm:70px"
      alt=""
      class="rounded-full"
      :src="sponsor"
      loading="lazy"
      decoding="async"
      format="webp"
      height="35"
      width="35"
    />
  </div>
</template>
