<template>
  <div id="app">
    <TheSiteHeader />
    <router-view />
    <TheSiteFooter />
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

import TheSiteHeader from '@/views/layout/TheSiteHeader.vue'
import TheSiteFooter from '@/views/layout/TheSiteFooter.vue'

export default createComponent({
  components: { TheSiteHeader, TheSiteFooter }
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
  > header + * {
    @apply flex-grow;
  }

  > header,
  > footer {
    @apply text-center mx-auto px-4 py-2;
    max-width: 50rem;
  }
}
</style>
