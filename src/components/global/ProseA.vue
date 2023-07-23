<script setup lang="ts">
defineProps({
  href: {
    type: String,
    default: '',
  },
  target: {
    type: String,
    default: undefined,
    required: false,
  },
})
</script>

<template>
  <NuxtLink :href="href" class="underlined-link" :target="target">
    <slot />
  </NuxtLink>
</template>
