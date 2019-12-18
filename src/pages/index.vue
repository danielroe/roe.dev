<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <HomePage />
    </main>
    <h3>Recent articles</h3>
    <BlogList :limit="4" />

    <h3>Projects</h3>
    <GithubRepos />
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

import BlogList from '@/components/BlogList.vue'
import GithubRepos from '@/components/GithubRepos.vue'
import home from '@/content/index.md'

export default createComponent({
  components: {
    BlogList,
    GithubRepos,
    HomePage: home.vue.component,
  },
  head: {
    title: 'Home - Daniel Roe',
  },
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