<template>
  <div>
    <header><h2>Articles</h2></header>
    <main>
      <BlogList />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  head: {
    title: 'Blog',
  },
})
</script>
