<template>
  <nuxt-picture
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :class="className"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  class: {
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

const className = props.class
</script>
