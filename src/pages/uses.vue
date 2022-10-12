<template>
  <div :class="$style.uses">
    <header>
      <h2>Uses</h2>
    </header>
    <main>
      <StaticMarkdownRender v-if="page" :value="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Uses',
  meta: [{ hid: 'og:title', property: 'og:title', content: `Uses` }],
})

const { data: page } = await usePageData()
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
