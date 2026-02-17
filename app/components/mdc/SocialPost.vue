<script setup lang="ts">
const props = defineProps({
  link: String,
  datetime: String,
  social: String as () => 'twitter',
})
const icon = props.social === 'twitter' ? 'i-ri:twitter-fill' : ''
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
      <div
        v-if="social"
        class="max-w-6"
      >
        <span
          class="h-4 w-4"
          :class="icon"
          aria-hidden="true"
        />
      </div>
      <component
        :is="link ? 'a' : 'div'"
        :href="link"
        :target="link ? '_blank' : undefined"
        :rel="link ? 'noopener noreferrer' : undefined"
        :class="link ? 'rounded f-ring' : undefined"
      >
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
