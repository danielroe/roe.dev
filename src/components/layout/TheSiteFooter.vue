<template functional>
  <footer :class="$style.footer">
    <small>&copy; 2019-2020 Daniel Roe. All rights reserved.</small>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({})
</script>

<style lang="postcss" module>
.footer {
  @apply relative;

  &::before {
    @apply block mx-auto my-4;
    border-top: 2px solid theme('colors.gray.700');
    width: 1rem;
    content: '';
  }
}
</style>
