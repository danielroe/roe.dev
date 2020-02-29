<template>
  <div :class="$style.index">
    <header><h2>Articles</h2></header>
    <main>
      <BlogList />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

import BlogList from '@/components/BlogList.vue'

export default defineComponent({
  components: { BlogList },
  head: {
    title: 'Blog',
  },
})
</script>

<style lang="postcss" module>
.index {
}
</style>
