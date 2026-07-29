<script setup lang="ts">
defineProps({
  id: {
    type: String,
    default: undefined,
  },
})
</script>

<template>
  <h3 :id="id">
    <a
      v-if="id"
      :href="`#${id}`"
    >
      <slot />
    </a>
    <slot v-else />
  </h3>
</template>
