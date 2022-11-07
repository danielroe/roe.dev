<template>
  <div id="app" class="font-sans overflow-x-hidden min-h-screen flex flex-col">
    <LayoutTheSiteHeader v-once />
    <NuxtPage />
    <LayoutTheSiteFooter v-once />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const PATH_RE = createRegExp(
  exactly(char.times.any().and(charNotIn('/')))
    .as('path')
    .and(exactly('/').optionally())
    .at.lineEnd()
)

const { path = '/' } = route.fullPath.match(PATH_RE)?.groups ?? {}
const url = `https://roe.dev${path}`

useHead({
  htmlAttrs: { lang: 'en' },
  meta: [{ property: 'og:url', content: url }],
  link: [{ rel: 'canonical', href: url }],
})
</script>

<style>
/* latin-ext */
@font-face {
  font-family: Barlow;
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('Barlow Regular'), local('Barlow-Regular'),
    url('/fonts/barlow-7cHpv4kjgoGqM7E_Ass52Hs.woff2') format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
    U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

/* latin */
@font-face {
  font-family: Barlow;
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('Barlow Regular'), local('Barlow-Regular'),
    url('/fonts/barlow-7cHpv4kjgoGqM7E_DMs5.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

/* latin */
@font-face {
  font-family: 'Fira Code';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/firacode-uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7Ng.woff2')
    format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

.dark-mode {
  --background: theme('colors.gray.800');
  --accent: theme('colors.gray.900');
  --text-base: theme('colors.white');
  --text-muted: theme('colors.gray.300');
}

.light-mode {
  --background: theme('colors.gray.200');
  --accent: theme('colors.gray.100');
  --text-base: theme('colors.gray.800');
  --text-muted: theme('colors.gray.700');
}

a {
  @apply relative inline-block;

  &::after {
    @apply block border-transparent;

    margin: -0.5em -0.25em 0;
    transition: 0.3s border-color, 0.3s opacity;
    width: calc(100% + 0.5em);
    border-bottom-width: 8px;
    content: '';
  }
}

#app {
  background-color: var(--background, theme('colors.gray.800'));
  color: var(--text-base, theme('colors.white'));
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Body of site */
  > nav + * {
    @apply flex-grow mx-auto p-4 w-full;

    max-width: 70ch;

    header {
      @apply leading-none;

      margin: 5vw 0 1vw;
    }

    main {
      @apply text-lg;

      color: var(--text-muted, theme('colors.gray.300'));

      a:not([href^='#']) {
        &::after {
          border-color: currentcolor;
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
}

.visually-hidden:not(:focus, :active) {
  position: absolute !important;
  width: 1px;
  height: 1px;
  overflow: hidden;
  white-space: nowrap; /* added line */
  clip: rect(1px 1px 1px 1px); /* IE6, IE7 */
  clip: rect(1px, 1px, 1px, 1px);
}
</style>
