<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[70ch]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Uses</h1>
    </header>
    <main class="text-lg" :class="$style.uses">
      <StaticMarkdownRender v-if="page" :value="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Uses',
  meta: [{ hid: 'og:title', property: 'og:title', content: `Uses` }],
})

const { data: page } = await useAsyncData(
  () =>
    ((process.server || process.dev) as true) &&
    queryContent('/uses').only(['title', 'type', 'body']).findOne()
)
</script>

<style module>
.uses {
  h2,
  h3 {
    @apply mt-6;
  }

  ul {
    @apply mt-4 pl-4;

    list-style-type: '✦ ';

    ul {
      list-style-type: '‣ ';
    }
  }
}
</style>
