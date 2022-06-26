<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <StaticMarkdownRender v-if="page" :value="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { data: page } = await usePageData()
</script>

<style module>
.home {
  p + p {
    @apply mt-4;
  }

  h3 {
    @apply mt-12;
  }
}
</style>
