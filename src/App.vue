<template>
  <div id="app" :style="themeStyle">
    <TheSiteHeader />
    <router-view />
    <TheSiteFooter />
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

import TheSiteHeader from '@/components/layout/TheSiteHeader.vue'
import TheSiteFooter from '@/components/layout/TheSiteFooter.vue'

import { useTheme } from './utils/theme'

export default createComponent({
  components: { TheSiteHeader, TheSiteFooter },
  setup() {
    const { themeStyle } = useTheme()

    return {
      themeStyle,
    }
  },
})
</script>

<style lang="postcss">
@import 'assets/styles/tailwind.postcss';

#app {
  @apply font-sans;
  @apply overflow-x-hidden min-h-screen;
  @apply flex flex-col;
  background-color: var(--background, theme('colors.gray.800'));
  color: var(--text-base, theme('colors.white'));
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Body of site */
  > nav + * {
    @apply flex-grow;

    @apply mx-auto p-4 w-full;
    max-width: 70ch;

    header {
      margin: 5vw 0 1vw;
      h2 {
        @apply text-2xl leading-tight;
      }
      dl {
        @apply flex flex-row flex-wrap;
        @apply uppercase text-xs;
      }
      dt {
      }
      dd {
        @apply font-semibold mx-2;

        + dt {
          @apply ml-2;
        }

        > span {
          + span {
            &::before {
              @apply mx-1 inline-block font-bold;
              content: '•';
            }
          }
        }
      }
    }
    main {
      @apply text-lg;
      color: var(--text-muted, theme('colors.gray.300'));

      a {
        &::after {
          border-color: currentColor;
          opacity: 0.1;
        }
        &:hover,
        &:active,
        &:focus {
          @apply outline-none;
          &::after {
            opacity: 0.2;
          }
        }
      }
    }
  }

  > footer {
    @apply text-center mx-auto px-4 py-2;
    max-width: 50rem;
  }
}
a {
  @apply relative inline-block;
  &::after {
    @apply block border-transparent;
    margin: -0.5em -0.25em 0 -0.25em;
    transition: 0.3s border-color, 0.3s opacity;
    width: calc(100% + 0.5em);
    border-bottom-width: 8px;
    content: '';
  }
}
</style>
