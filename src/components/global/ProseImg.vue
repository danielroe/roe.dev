<template>
  <nuxt-picture :src="src" :alt="alt" :width="width" :height="height" />
</template>

<script setup lang="ts">
defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  width: {
    type: [String, Number],
    default: 720,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
})
</script>
