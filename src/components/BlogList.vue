<template>
  <ItemList>
    <router-link
      v-for="{ title, slug, date } in entries"
      :key="slug"
      :to="`/blog/${slug}`"
      :title="title"
    >
      <article>
        <header>
          {{ title }}
          <dl v-if="date">
            <dt>Published</dt>
            <dd>
              <time :datetime="date">{{ formatDate(date) }}</time>
            </dd>
          </dl>
        </header>
      </article>
    </router-link>
  </ItemList>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

import ItemList from '@/components/ItemList.vue'

import { useBlogEntries } from '@/utils/blogs'

export default createComponent({
  components: { ItemList },
  props: {
    limit: {
      type: Number as () => number,
      default: 0,
    },
  },
  setup(props) {
    const { entries } = useBlogEntries()
    function formatDate(date: string) {
      const d = new Date(date)
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    }
    return {
      entries: props.limit ? entries.slice(0, props.limit) : entries,
      formatDate,
    }
  },
})
</script>