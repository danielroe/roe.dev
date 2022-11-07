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
