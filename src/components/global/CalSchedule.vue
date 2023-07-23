<script setup lang="ts">
defineProps({
  meeting: String,
  message: String,
})
</script>

<template>
  <button
    class="underlined-link mt-4"
    :data-cal-link="`danielroe/${meeting}`"
    type="button"
  >
    <span class="i-ri:calendar-check-fill h-4 w-4" alt="" />
    {{ message }}
  </button>
</template>
