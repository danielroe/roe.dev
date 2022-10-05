<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <button
    aria-label="Change site theme"
    type="button"
    class="p-2 ml-2 transition-opacity focus:outline-none hover:opacity-70 focus:opacity-70"
    @click="
      colorMode.value === 'dark'
        ? (colorMode.preference = 'light')
        : (colorMode.preference = 'dark')
    "
  >
    <span
      :class="$style.disc"
      class="block rounded-full h-4 w-4 border-2 border-solid outline-none"
    />
  </button>
</template>

<style module>
.disc {
  background-color: var(--text-base, theme('colors.gray.800'));
}
</style>
