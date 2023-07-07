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
    <nuxt-link
      to="https://github.com/sponsors/danielroe"
      class="pure rounded-full border-gray border-dashed border h-[35px] w-[35px] flex flex-col justify-center items-center hover:opacity-50 focus:opacity-50 transform-opacity"
      target="_blank"
      alt="Become a sponsor"
    >
      <div class="block i-ri:add-fill h-6 w-6" />
    </nuxt-link>
  </div>
</template>
