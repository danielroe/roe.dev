<script setup lang="ts">
const sponsors = await $fetch<string[]>('/api/sponsors')
</script>

<template>
  <div class="flex gap-3 flex-row flex-wrap mx-auto justify-start relative">
    <NuxtImg
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
    <NuxtLink
      to="https://github.com/sponsors/danielroe"
      class="pure rounded-full border-primary outline-none border-dashed border h-[35px] w-[35px] flex flex-col justify-center items-center hover:border-solid focus:border-solid active:border-solid hover:bg-accent focus:bg-accent active:bg-accent"
      target="_blank"
    >
      <div class="block i-ri:add-fill h-6 w-6" />
      <span class="sr-only">Sponsor me on GitHub</span>
    </NuxtLink>
  </div>
</template>
