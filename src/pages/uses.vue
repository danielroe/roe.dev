<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Uses</h1>
    </header>
    <main class="text-lg" :class="$style.uses">
      <StaticMarkdownRender v-if="page" :value="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Uses' })

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
