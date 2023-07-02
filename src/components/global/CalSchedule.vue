<script setup lang="ts">
defineProps({
  meeting: String,
  message: String,
})
</script>

<template>
  <button
    class="flex flex-row link gap-2 mt-4"
    :data-cal-link="`danielroe/${meeting}`"
    type="button"
  >
    <svg class="inline-block h-4 w-4" alt="">
      <use xlink:href="#calendar" />
    </svg>
    {{ message }}
  </button>
</template>
