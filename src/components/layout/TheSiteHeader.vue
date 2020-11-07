<template>
  <nav :class="$style.header">
    <ul>
      <li>
        <h1>
          <NuxtLink to="/" title="Daniel Roe">DCR</NuxtLink>
        </h1>
      </li>
      <li><NuxtLink to="/work">Work</NuxtLink></li>
      <li><NuxtLink to="/blog">Blog</NuxtLink></li>
    </ul>
    <button
      aria-label="Change site theme"
      type="button"
      @click="
        $colorMode.value === 'dark'
          ? ($colorMode.preference = 'light')
          : ($colorMode.preference = 'dark')
      "
    >
      <span />
    </button>
  </nav>
</template>

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

  :global(.nuxt-link-exact-active) {
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
