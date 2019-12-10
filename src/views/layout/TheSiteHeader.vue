<template functional>
  <header :class="$style.header">
    <h1>Daniel Roe</h1>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
      <router-link to="/blog">Blog</router-link>
    </nav>
  </header>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

export default createComponent({})
</script>

<style lang="postcss" module>
.header {
    h1 {
        @apply text-3xl;
    }

    nav {
        @apply flex flex-row justify-center items-center;

        @apply uppercase text-sm;
        letter-spacing: 0.15rem;

        > * + * {
            &::before {
                @apply font-bold;
                @apply inline-block;
                @apply mx-4;
                content: '•';
            }
        }
    }
}
</style>
