<script setup lang="ts">
defineProps({
  meeting: String,
  message: String,
})
</script>

<template>
  <a
    class="underlined-link mt-4"
    :data-cal-link="`danielroe/${meeting}`"
    :href="`https://cal.com/danielroe/${meeting}`"
  >
    <span
      class="i-ri:calendar-check-fill h-4 w-4"
      alt=""
    />
    {{ message }}
  </a>
</template>
