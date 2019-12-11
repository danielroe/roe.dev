<template functional>
  <nav :class="$style.header">
    <h1>
      <router-link to="/" title="Daniel Roe">DCR</router-link>
    </h1>
    <ul>
      <li><router-link to="/about">About</router-link></li>
      <li><router-link to="/blog">Blog</router-link></li>
    </ul>
    <div />
  </nav>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

export default createComponent({})
</script>

<style lang="postcss" module>
.header {
  @apply p-4 uppercase bg-gray-900 flex flex-row justify-between items-center;
  letter-spacing: 0.15rem;

  a {
    @apply outline-none;
    @apply relative inline-block px-4 py-2;
      &::after {
        @apply block -mt-2 -mx-1 border-transparent;
        transition: 0.3s border-color;
        width: calc(100% + 0.5rem);
        border-bottom-width: 8px;
        content: '';
      }

      &:hover,
      &:focus {
        &::after {
          @apply border-gray-700;
        }
      }
  }

    :global(.router-link-exact-active) {
      &::after {
        @apply border-gray-800;
      }
    }

/* Header */
> :first-child{
  @apply font-semibold;
}
  ul {
    @apply flex flex-row justify-center items-center;

    > * + * {
      &::before {
        @apply font-bold;
        @apply inline-block;
        content: '•';
      }
    }
  }
}
</style>
