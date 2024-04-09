<script setup lang="ts">
/* eslint-disable vue/require-v-for-key */
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: null,
  },
  tags: {
    type: Array as () => string[],
    default: () => [],
  },
})

console.log({ props })
</script>

<template>
  <article class="h-full w-full flex flex-col items-start justify-end font-sans py-24 px-16 bg-[#1a202c] text-white">
    <header class="text-7xl">
      {{ title }}
    </header>
    <div class="mt-10 text-[#e2e8f0] uppercase text-5xl flex flex-col">
      <div
        v-if="date"
        class="flex flex-row"
      >
        <div class="mr-6">
          Published
        </div>
        <div class="font-bold mx-8">
          {{ date }}
        </div>
      </div>
      <div
        v-if="tags?.length"
        class="flex flex-row mt-4"
      >
        <div class="mr-6">
          Tags
        </div>
        <div class="font-bold mx-8 flex flex-row gap-4">
          <template v-for="(tag, index) in tags">
            <span v-if="index > 0">•</span>
            <span>{{ tag }}</span>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>
