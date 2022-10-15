<template>
  <NuxtLink
    :class="$style.item"
    class="p-4 m-2 relative text-xl flex flex-col justify-end shadow hover:outline-none active:outline-none focus:outline-none min-h-12 md:min-h-[10rem] transition-all border-[1px] border-solid border-transparent after:text-transparent flex-[100%] md:flex-[40%]"
    v-bind="$attrs"
  >
    <slot />
  </NuxtLink>
</template>

<style module>
.item {
  background-color: var(--accent, theme('colors.gray.900'));

  &:hover,
  &:active,
  &:focus {
    border-color: var(--text-muted);
  }
}
</style>
