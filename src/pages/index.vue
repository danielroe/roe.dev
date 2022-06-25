<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <ContentDoc v-if="page" :document="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { data: page } = await useAsyncData('home', () =>
  queryContent('/')
    .only(['title', 'type', 'body'])
    .findOne()
    .then(async r =>
      process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
    )
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
