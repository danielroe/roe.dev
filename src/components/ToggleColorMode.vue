<template>
  <ColorScheme placeholder="...">
    <button
      aria-label="Change site theme"
      type="button"
      class="h-7 w-12 relative rounded-full bg-accent ml-2 items-center justify-start px-1 transition-opacity outline-none border-2 border-solid border-accent hover:border-primary focus:border-primary active:border-primary"
      @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'"
    >
      <span
        :class="['absolute -top-[50%] translate-y-[100%] inline-block rounded-full h-4 w-4 bg-primary transition-transform', $colorMode.value === 'dark' ? '-translate-x-4.5': 'translate-x-0.5']"
      />
    </button>
  </ColorScheme>
</template>
