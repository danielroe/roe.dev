<script setup lang="ts">
defineProps({
  link: String,
  datetime: String,
})
</script>

<template>
  <div class="mb-6">
    <div class="normal-case tracking-normal text-base text-white opacity-70">
      <slot />
    </div>
    <div
      v-if="datetime || link"
      class="flex flex-row justify-between mt-6 pb-0 !mb-2"
    >
      <NuxtTime
        v-if="datetime"
        :datetime="datetime"
        weekday="long"
        day="numeric"
        month="long"
        year="numeric"
      />
      <div v-else />
      <a v-if="link" class="self-end" :href="link">Link</a>
    </div>
  </div>
</template>
