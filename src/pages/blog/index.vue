<template>
  <div :class="$style.index">
    <header><h2>Articles</h2></header>
    <main>
      <article v-for="{ title, slug } in entries" :key="slug">
        <router-link :to="`/blog/${slug}`">
          {{ title }}
        </router-link>
      </article>
    </main>
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

const blogs = require.context('./', true, /.md$/, 'lazy')

export default createComponent({
  head: {
    title: 'Blog',
  },
  setup() {
    const entries = blogs.keys().map(key => {
      const {
        attributes: { title },
      } = require(`${key}?meta`)
      const slug = key.slice(2, -3)

      return { title, slug }
    })
    return {
      entries,
    }
  },
})
</script>

<style lang="postcss" module>
.index {
}
</style>
