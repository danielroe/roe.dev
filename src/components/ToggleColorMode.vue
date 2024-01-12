<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <button
    v-if="colorMode"
    aria-label="Change site theme"
    type="button"
    class="h-7 w-12 relative rounded-full bg-accent ml-2 items-center justify-start px-1 transition-opacity outline-none border-2 border-solid border-accent hover:border-primary focus:border-primary active:border-primary"
    @click="
      colorMode.value === 'dark'
        ? (colorMode.preference = 'light')
        : (colorMode.preference = 'dark')
    "
  >
    <span
      class="inline-block rounded-full h-4 w-4 bg-primary transition-transform"
      :style="
        colorMode.value === 'light' ? 'transform:translateX(1.25rem)' : ''
      "
    />
  </button>
</template>
