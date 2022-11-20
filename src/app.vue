<template>
  <div id="app" class="font-sans overflow-x-hidden min-h-screen flex flex-col">
    <LayoutTheSiteHeader v-once />
    <NuxtPage />
    <LayoutTheSiteFooter v-once />
  </div>
</template>

<script lang="ts" setup>
import { useServerHead } from '@vueuse/head'

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
  title: '',
  htmlAttrs: { lang: 'en' },
  titleTemplate: title => (title ? `${title} - Daniel Roe` : 'Daniel Roe'),
  meta: [
    { name: 'theme-color', content: '#1a202c' },
    { name: 'msapplication-TileColor', content: '#1a202c' },
  ],
})

if (process.server) {
  useServerHead({
    meta: [
      { property: 'og:url', content: url },
      {
        property: 'og:image',
        content: `https://roe.dev/og/og.jpg`,
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        name: 'description',
        content: `The personal website of Daniel Roe`,
      },
      {
        property: 'og:description',
        content: `The personal website of Daniel Roe`,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@danielcroe' },
      { name: 'twitter:creator', content: '@danielcroe' },
    ],
    link: [
      ...[
        '/fonts/barlow-7cHpv4kjgoGqM7E_Ass52Hs.woff2',
        '/fonts/firacode-uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7Ng.woff2',
        '/fonts/barlow-7cHpv4kjgoGqM7E_DMs5.woff2',
      ].map(
        href =>
          ({
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
            href,
          } as const)
      ),
      { rel: 'canonical', href: url },
      { rel: 'mask-icon', color: '#fff', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/svg', href: '/favicon.svg' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#1a202c' },
    ],
  })
}
</script>
