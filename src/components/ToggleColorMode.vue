<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <button
    aria-label="Change site theme"
    type="button"
    class="h-7 w-7 ml-2 items-center justify-center transition-opacity focus:outline-none hover:opacity-70 focus:opacity-70"
    @click="
      colorMode.value === 'dark'
        ? (colorMode.preference = 'light')
        : (colorMode.preference = 'dark')
    "
  >
    <span
      class="block rounded-full h-4 w-4 border-2 border-solid outline-none bg-[var(--text-base)]"
    />
  </button>
</template>
