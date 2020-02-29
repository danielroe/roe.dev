<template>
  <nav :class="$style.header">
    <ul>
      <li>
        <h1>
          <router-link to="/" title="Daniel Roe">DCR</router-link>
        </h1>
      </li>
      <li><router-link to="/work">Work</router-link></li>
      <li><router-link to="/blog">Blog</router-link></li>
    </ul>
    <button aria-label="Change site theme" @click="toggleTheme">
      <span />
    </button>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

import { useTheme } from '../../utils/theme'

export default defineComponent({
  setup() {
    const { theme, toggleTheme } = useTheme()
    return {
      toggleTheme,
      theme,
    }
  },
})
</script>

<style lang="postcss" module>
.header {
  @apply p-4 uppercase bg-gray-900 flex flex-row justify-between items-center;
  @apply text-white;
  letter-spacing: 0.15rem;

  a {
    @apply outline-none;
    @apply px-4 py-2;

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
  > :first-child {
    @apply font-semibold;
  }
  > :last-child {
    @apply p-2;
    span {
      @apply block rounded-full h-4 w-4 border-2 border-solid outline-none;

      border-color: var(--background, theme('colors.white'));
      background-color: var(--text-base, theme('colors.gray.800'));
    }
    transition: 0.3s opacity;

    &:hover,
    &:focus {
      @apply outline-none;
      opacity: 0.7;
    }
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
