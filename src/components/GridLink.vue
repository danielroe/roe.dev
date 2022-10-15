<template>
  <NuxtLink
    :class="$style.item"
    class="p-4 m-2 relative text-xl flex flex-col justify-end shadow hover:outline-none active:outline-none focus:outline-none"
    v-bind="$attrs"
  >
    <slot />
  </NuxtLink>
</template>

<style module>
.item {
  background-color: var(--accent, theme('colors.gray.900'));
  min-height: 10rem;
  flex: 40%;
  @media (width < 767px) {
    flex: 100%;
    min-height: 3rem;
  }

  transition: 0.3s transform, 0.3s border-color;
  border: 1px solid transparent;

  &:hover,
  &:active,
  &:focus {
    border-color: var(--text-muted);
  }

  &::after {
    @apply text-transparent;
  }
}
</style>
