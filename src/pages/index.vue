<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <Content v-if="page" :document="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Daniel Roe',
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { data: page } = await useAsyncData('home', () =>
  queryContent('/').where({ slug: '/' }).findOne()
)
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
