<template>
  <div id="app" :class="theme || 'dark'">
    <TheSiteHeader />
    <router-view />
    <TheSiteFooter />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { Route } from 'vue-router'

import TheSiteHeader from '@/components/layout/TheSiteHeader.vue'
import TheSiteFooter from '@/components/layout/TheSiteFooter.vue'

import { useTheme } from './utils/theme'
import { getMatchOrReturn } from './utils/global'

export default defineComponent({
  components: { TheSiteHeader, TheSiteFooter },
  head(this: { $route: Route }) {
    const path = getMatchOrReturn(this.$route.fullPath, /(.*[^/])\/?$/, 1)
    const url = `https://roe.dev${path}`

    return {
      meta: [
        { property: 'og:url', content: url },
        {
          vmid: 'og:image',
          property: 'og:image',
          content: `https://roe.dev/og/og.jpg`,
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        {
          name: 'description',
          content: `The personal website of Daniel Roe`,
          vmid: 'description',
        },
        {
          property: 'og:description',
          content: `The personal website of Daniel Roe`,
          vmid: 'og:description',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@danielcroe' },
        { name: 'twitter:creator', content: '@danielcroe' },
      ],
      link: [
        {
          rel: 'canonical',
          href: url,
        },
      ],
    }
  },
  setup() {
    const { theme } = useTheme()

    return {
      theme,
    }
  },
})
</script>

<style lang="postcss">
@tailwind base;

#app {
  @apply font-sans;
  @apply overflow-x-hidden min-h-screen;
  @apply flex flex-col;
  background-color: var(--background, theme('colors.gray.800'));
  color: var(--text-base, theme('colors.white'));
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  &.dark {
    --background: theme('colors.gray.800');
    --accent: theme('colors.gray.900');
    --text-base: theme('colors.white');
    --text-muted: theme('colors.gray.300');
  }

  &.light {
    --background: theme('colors.gray.200');
    --accent: theme('colors.gray.100');
    --text-base: theme('colors.gray.800');
    --text-muted: theme('colors.gray.700');
  }

  /* Body of site */
  > nav + * {
    @apply flex-grow;

    @apply mx-auto p-4 w-full;
    max-width: 70ch;

    header {
      @apply leading-none;
      margin: 5vw 0 1vw;
      h2 {
        @apply text-2xl;
      }
      dl {
        @apply flex flex-row flex-wrap mt-1;
        @apply leading-normal;
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
      @media (width < 767px) {
        dl {
          @apply block;
        }
        dt {
          @apply float-left mr-2;
        }
        dd + dt {
          @apply ml-0;
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
