<script setup lang="ts">
defineProps({
  id: {
    type: String,
    default: undefined,
  },
})
</script>

<template>
  <h2 :id="id">
    <a
      v-if="id"
      :href="`#${id}`"
    >
      <slot />
    </a>
    <slot v-else />
  </h2>
</template>
