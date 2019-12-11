<template functional>
  <footer :class="$style.footer">
    &copy; 2018-2019 Daniel Roe. All rights reserved.
  </footer>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

export default createComponent({})
</script>

<style lang="postcss" module>
.footer {
  @apply text-sm relative;

  &::before {
    @apply block mx-auto my-4;
    border-top: 2px solid theme('colors.gray.700');
    width: 1rem;
    content: '';
  }
}
</style>
