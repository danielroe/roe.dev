<template>
  <div id="app">
    <TheSiteHeader />
    <router-view />
    <TheSiteFooter />
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

import TheSiteHeader from '@/components/layout/TheSiteHeader.vue'
import TheSiteFooter from '@/components/layout/TheSiteFooter.vue'

export default createComponent({
  components: { TheSiteHeader, TheSiteFooter },
})
</script>

<style lang="postcss">
@import 'assets/styles/tailwind.postcss';

#app {
  @apply font-sans;
  @apply overflow-x-hidden min-h-screen;
  @apply flex flex-col;
  @apply bg-gray-800 text-white;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Body of site */
  > nav + * {
    @apply flex-grow;

    @apply mx-auto p-4 w-full;
    max-width: 70ch;

    header {
      @apply text-2xl leading-tight;
      margin: 5vw 0 1vw;
    }
    main {
      @apply text-gray-300 text-lg;
    }
  }

  > footer {
    @apply text-center mx-auto px-4 py-2;
    max-width: 50rem;
  }
}
</style>
