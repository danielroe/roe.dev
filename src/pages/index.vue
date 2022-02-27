<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <Content v-if="page" :id="page.id" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useMeta({
  title: 'Daniel Roe',
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { findOne } = useContentQuery('/')
const { data: page } = await useAsyncData('page-content', findOne)
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
