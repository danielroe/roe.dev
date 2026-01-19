<script setup lang="ts">
const colorMode = useColorMode()

const ariaLabel = computed(() => {
  const currentMode = colorMode.value
  const targetMode = currentMode === 'dark' ? 'light' : 'dark'
  return `Switch to ${targetMode} mode (currently ${currentMode})`
})
</script>

<template>
  <button
    v-if="colorMode"
    :aria-label="ariaLabel"
    type="button"
    class="h-7 w-12 relative rounded-full bg-accent ml-2 items-center justify-start px-1 border-2 border-solid f-ring touch-action-manipulation border-muted/50 hover:border-muted active:border-muted motion-safe:transition-colors"
    @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
  >
    <span
      class="inline-block rounded-full h-4 w-4 bg-primary light:translate-x-5 i-tabler:moon light:i-tabler:sun-high light:h-4 light:w-4 motion-safe:transition-transform"
      aria-hidden="true"
    />
  </button>
</template>
