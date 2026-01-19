<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <button
    v-if="colorMode"
    aria-label="Change site theme"
    type="button"
    class="h-7 w-12 relative rounded-full bg-accent ml-2 items-center justify-start px-1 transition-opacity border-2 border-solid border-accent hover:border-primary active:border-primary f-ring"
    @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
  >
    <span
      class="inline-block rounded-full h-4 w-4 bg-primary transition-transform light:translate-x-5 i-tabler:moon light:i-tabler:sun-high light:h-4 light:w-4"
    />
  </button>
</template>
