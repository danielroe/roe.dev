<template functional>
  <aside :class="[$style.list, data.staticClass, data.class]">
    <slot />
  </aside>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

export default createComponent({})
</script>

<style lang="postcss" module>
.list {
  @apply flex flex-row flex-wrap -mx-2;
  > * {
    @apply p-4 m-2 relative;
    @apply text-xl flex flex-col justify-end;
    @apply shadow;
    background-color: var(--accent, theme('colors.gray.900'));
    min-height: 10rem;
    flex: 40%;
    @media (width < 767px) {
      flex: 100%;
      min-height: 3rem;
    }
    transition: 0.3s transform;
    border: 1px solid transparent;
    transition: 0.3s border-color;

    &:hover,
    &:active,
    &:focus {
      @apply outline-none;
      border-color: var(--text, theme('colors.muted'));
    }
    &::after {
      @apply text-transparent;
    }
  }
}
</style>
