<script setup lang="ts">
defineProps({
  link: String,
  datetime: String,
  social: String,
})
</script>

<template>
  <div class="mb-6">
    <div class="normal-case tracking-normal text-base text-white opacity-70">
      <slot />
    </div>
    <div
      v-if="datetime || link || social"
      class="flex flex-row gap-2 w-full mt-6 pb-0 !mb-2"
    >
      <div v-if="social" class="max-w-6">
        <svg class="inline-block h-4 w-4 fill-current" alt="">
          <use :xlink:href="`#${social}`" />
        </svg>
      </div>
      <component :is="link ? 'a' : 'div'" :href="link">
        <NuxtTime
          v-if="datetime"
          :datetime="datetime"
          weekday="long"
          day="numeric"
          month="long"
          year="numeric"
        />
      </component>
    </div>
  </div>
</template>
