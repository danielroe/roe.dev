<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <NuxtContent :document="page" />
    </main>
    <h3>Recent articles</h3>
    <BlogList :limit="4" />

    <h3>Projects</h3>
    <GithubRepos />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  head: {
    title: 'Daniel Roe',
    meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
  },
  async fetch() {
    this.page = await this.$content(`index`).fetch()
  },
  data: () => ({ page: null as any }),
})
</script>

<style lang="postcss" module>
.home {
  p + p {
    @apply mt-4;
  }
  h3 {
    @apply mt-12;
  }
}
</style>
